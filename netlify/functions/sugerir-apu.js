"use strict";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const reply = (statusCode, obj) => ({ statusCode, headers: corsHeaders, body: JSON.stringify(obj) });

const SYSTEM_PROMPT = `Eres un experto en instalaciones eléctricas y presupuestos de obra en Colombia. Analiza la descripción de cada ítem de un presupuesto eléctrico y determina qué materiales, equipos y mano de obra requiere.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después, sin bloques markdown. Solo JSON puro.

# Apartados y campos (usa SOLO valores exactos de "opciones")

TU (Tubería). opciones.TU = {"MATERIAL":{"TIPO":["diam1","diam2",...]}}. Respeta el anidado: material = clave de nivel 1, tipo = clave bajo ese material, diam = valor del arreglo bajo ese tipo.
- Campos: material, tipo, diam, cantidad (default 1)
- Usa TU para: tubería, canalización, ducto, conduit, acometida (parte tubo)

EQ (Equipos). opciones.EQ = {"FAMILIA":["SUBFAMILIA1",...]}. familia DEBE ser una clave de opciones.EQ y subfamilia DEBE ser un valor del arreglo bajo esa clave. NUNCA combines una familia con una subfamilia de otra familia.
- Campos: familia, subfamilia, cantidad (default 1)
- Usa EQ para: interruptor, breaker, totalizador, contactor, relé, UPS, planta, luminaria, reflector, sensor, variador
- Equipos especiales (transformadores, celdas, TGA, tableros de fabricación especial) van en EQ: busca en las familias del catálogo.

CA (Cableado). opciones.CA.cables[] con {cod, desc}.
- Campos: fase (cod), cantFase (1 mono, 2 bi, 3 tri), neutro (cod), cantNeutro (normalmente 1), tierra (cod, 1-2 calibres menor), cantTierra (normalmente 1), metrado (default 0), repite (default 0), bornas (default true)
- Busca el cable por calibre AWG (8, 10, 12, 14...) y tipo (THHN, THWN) contra opciones.CA.cables[].desc
- Usa CA para: cable, conductor, alimentador, circuito, acometida (parte cable)

SA (Salidas). opciones.SA.aparatos
- Campos: aparato, modo ("completa" = tubo+cable+aparato, o "solo_punto" = solo mano de obra), matTub1, calTub1, matTub2, calTub2, calCable, matCable, estrato (1-6, default 3), promedio (m tubo por salida, default 5), caja
- Estándar: "toma" → aparato=TOMA, caja=CUADRADA. "iluminación"/"luminaria" → aparato=ILUMINACION, caja=OCTOGONAL. "datos" → aparato=DATOS, caja=CUADRADA. Caja HONDA = piso.
- Usa SA para: salida, punto eléctrico, toma, interruptor de luz, punto de iluminación/datos

TA (Tableros). opciones.TA = {"tableros":{"TIPO":["1","2",...]},"protecciones":{"BREAKER":[...],...}}. Los tableros tienen subitems (número de circuitos); las protecciones son ítems aparte.
- Campos: familia, subitem, cantidad (default 1)
- Usa TA para: tablero, gabinete, panel de distribución, barraje, cofre. Si la descripción menciona circuitos o protecciones, usa TA con el subitem de circuitos correcto e incluye las protecciones como ítems aparte.

mo (Mano de obra). opciones.mo.items (planos)
- Campos: item, cantidad (default 1)
- Usa mo para: instalación, montaje, conexión, pruebas, certificación, canaleta, bandeja portacables

# Reglas
1. SOLO valores exactos de opciones; si no hay exacto, el más cercano.
2. Si no puedes determinar un apartado con confianza, omítelo.
3. Analiza siempre si un ítem combina varios apartados. Ej: "tubería PVC 1 con cable 3x12 cu" requiere TU y CA.
4. Lotes: responde un array donde cada elemento tiene "apu" coincidiendo con el input.
5. Incluye siempre "razonamiento" con tu análisis breve.
6. Si el input trae "correcciones", son ejemplos de correcciones anteriores del usuario. Cada una tiene "desc" (descripción del ítem), "incorrecto" (lo que sugeriste mal) y "correcto" (lo que el usuario corrigió). Prioriza estos patrones corregidos sobre tu criterio propio para ítems similares.

# Ejemplo (ítem individual)
{"TU":[{"material":"PVC","tipo":"ENTERRADA","diam":"3/4\\"","cantidad":1}],"EQ":[{"familia":"...","subfamilia":"...","cantidad":1}],"CA":[{"fase":"...","cantFase":3,"neutro":"...","cantNeutro":1,"tierra":"...","cantTierra":1,"metrado":0,"repite":0,"bornas":true}],"razonamiento":"Acometida trifásica en PVC enterrada con cables..."}`;

const SYSTEM_PROMPT_ORGANIZAR = `Eres un experto en instalaciones eléctricas y presupuestos de obra en Colombia.

TAREA: Organizar ítems de un presupuesto eléctrico.

1. AGRUPAR: Los ítems de "items" no tienen APU. Cada grupo será un APU nuevo con un solo precio unitario, así que solo agrupa ítems que sean la misma actividad con las mismas especificaciones. Si cambia el diámetro, calibre, capacidad, material o tipo, van en grupos distintos. Ante la duda, sepáralos.

2. CLASIFICAR: Para cada grupo nuevo y cada APU de "apusExistentes", determina sus apartados según la descripción:
   - CA (Cableados): cable, conductor, alimentador, circuito, parte de cable de una acometida
   - TU (Tuberías): tubería, canalización, ducto, conduit, parte de tubo de una acometida
   - TA (Tableros): tablero, gabinete, panel de distribución, barraje, cofre
   - EQ (Equipos): interruptor, breaker, totalizador, contactor, relé, UPS, planta, luminaria, reflector, sensor, variador, transformador, celda, TGA
   - SA (Salidas): salida, punto eléctrico, toma, interruptor de luz, punto de iluminación o datos
   - mo (Módulos): instalación, montaje, conexión, pruebas, certificación, canaleta, bandeja portacables

Un ítem puede tener varios apartados. Ejemplo: "Acometida en EMT 3/4 con cable 3x12" → ["TU","CA"]

- "grupos[].indices": posiciones base 0 de "items". Cada ítem de "items" debe aparecer en exactamente un grupo. Si "items" no viene, "grupos" va vacío.
- "reclasificar": incluye todo APU de "apusExistentes" con "cod" vacío y los que tengan una clasificación incorrecta. Si la clasificación ya es correcta, no lo incluyas.`;

const APARTADOS_ID = ["CA", "TU", "TA", "EQ", "SA", "mo"];
const ESQUEMA_ORGANIZAR = {
  type: "object",
  additionalProperties: false,
  required: ["grupos", "reclasificar"],
  properties: {
    grupos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["indices", "cod"],
        properties: {
          indices: { type: "array", items: { type: "integer" } },
          cod: { type: "array", items: { type: "string", enum: APARTADOS_ID } },
        },
      },
    },
    reclasificar: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["apu", "cod"],
        properties: {
          apu: { type: "integer" },
          cod: { type: "array", items: { type: "string", enum: APARTADOS_ID } },
        },
      },
    },
  },
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  if (event.httpMethod !== "POST") return reply(405, { error: "Método no permitido" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return reply(500, { error: "Falta ANTHROPIC_API_KEY en el servidor" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return reply(400, { error: "Cuerpo JSON inválido" });
  }

  const organizar = body.modo === "organizar";

  let res, data;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: organizar ? 16000 : 2048,
        system: [{ type: "text", text: organizar ? SYSTEM_PROMPT_ORGANIZAR : SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: JSON.stringify(body) }],
        ...(organizar ? { output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA_ORGANIZAR } } } : {}),
      }),
    });
    data = await res.json();
  } catch (e) {
    return reply(502, { error: "Fallo al llamar a Anthropic: " + e.message });
  }

  if (!res.ok) return reply(res.status, { error: data.error || data });

  if (organizar && data.stop_reason === "max_tokens") {
    return reply(200, { error: "La respuesta de la IA quedó cortada por ser demasiado larga", usage: data.usage });
  }
  if (organizar && data.stop_reason === "refusal") {
    return reply(200, { error: "La IA rechazó esta solicitud", usage: data.usage });
  }

  const textBlock = (data.content || []).find(b => b.type === "text");
  let text = (textBlock && textBlock.text) || "";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    let parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length === 1 && !body.lote) parsed = parsed[0];
    return reply(200, { sugerencia: parsed, usage: data.usage });
  } catch (e) {
    return reply(200, { raw: text, error: "La respuesta no es JSON válido", usage: data.usage });
  }
};
