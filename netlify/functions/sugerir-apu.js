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

TAREA: Organizar ítems de un presupuesto eléctrico en dos pasos.

1. AGRUPAR: Los ítems del array "items" NO tienen APU asignado. Agrupa los que describen el mismo trabajo o actividad. Ítems con descripciones iguales o muy similares van en el mismo grupo. Ítems diferentes van en grupos separados. Cada grupo se convertirá en un APU nuevo.

2. CLASIFICAR: Para cada grupo nuevo Y para cada APU en "apusExistentes" que tenga solo ["CA"] por defecto, determina los apartados correctos según la descripción:
   - CA (Cableados): cable, conductor, alimentador, acometida de cables
   - TU (Tuberías): tubería, ducto, conduit, canaleta, bandeja portacables
   - TA (Tableros): tablero, gabinete, panel de distribución, barraje, breaker, protecciones
   - EQ (Equipos): transformador, UPS, luminaria, reflector, sensor, variador, contactor
   - SA (Salidas): toma, punto eléctrico, interruptor de luz, iluminación, datos, punto de red
   - mo (Módulos): montaje, instalación, pruebas, certificación, mano de obra general

Un ítem puede pertenecer a varios apartados. Ejemplo: "Acometida en EMT 3/4 con cable 3x12" → ["TU","CA"]

IMPORTANTE: Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después.

{
  "grupos": [
    {"indices": [0, 3], "cod": ["TU", "CA"], "razon": "Tubería EMT con cableado"}
  ],
  "reclasificar": [
    {"apu": 5, "cod": ["TU"], "razon": "Solo tubería"}
  ]
}

- "indices": posiciones base 0 del array "items" del input que van juntas en un APU.
- "cod": array de IDs de apartados para ese grupo.
- "reclasificar": solo para APUs de "apusExistentes" que necesiten cambio de clasificación. Si un APU ya tiene la clasificación correcta, no lo incluyas.
- Cada ítem de "items" debe aparecer en exactamente un grupo.`;

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
        max_tokens: body.modo === "organizar" ? 4096 : 2048,
        system: [{ type: "text", text: body.modo === "organizar" ? SYSTEM_PROMPT_ORGANIZAR : SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: JSON.stringify(body) }],
      }),
    });
    data = await res.json();
  } catch (e) {
    return reply(502, { error: "Fallo al llamar a Anthropic: " + e.message });
  }

  if (!res.ok) return reply(res.status, { error: data.error || data });

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
