"use strict";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const reply = (statusCode, obj) => ({ statusCode, headers: corsHeaders, body: JSON.stringify(obj) });

const SYSTEM_PROMPT = `Eres un experto en instalaciones eléctricas y presupuestos de obra en Colombia. Tu trabajo es analizar la descripción de ítems de un presupuesto eléctrico y determinar qué materiales, equipos y mano de obra se necesitan para ejecutar cada ítem.

IMPORTANTE: Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido. Sin texto antes ni después, sin bloques de código markdown, sin comillas triples. Solo el JSON puro.

# Apartados disponibles y sus campos

TU (Tuberías/Canalización):
- material: tipo de tubería (DEBE ser uno de opciones.TU.familias, ej: "PVC", "EMT", "IMC", "GALVANIZADA")
- tipo: método de instalación (DEBE ser uno de opciones.TU.tipos, ej: "EXPUESTA", "ENTERRADA", "EMBEBIDA")
- diam: diámetro (DEBE ser uno de opciones.TU.diametros, ej: "1/2\"", "3/4\"", "1\"")
- cantidad: número de tramos (default 1)
- Usa TU cuando el ítem mencione: tubería, canalización, ducto, tubo conduit, acometida (la parte de tubo)

EQ (Equipos):
- familia: categoría general (DEBE ser uno de opciones.EQ.familias)
- subfamilia: equipo específico (DEBE ser uno de opciones.EQ.subfamilias)
- cantidad: default 1
- Usa EQ cuando el ítem mencione: interruptor, breaker, totalizador, contactor, relé, transformador, UPS, planta, luminaria, reflector, sensor, variador

CA (Cableado):
- fase: código del cable de fase (DEBE ser un cod de opciones.CA.cables[])
- cantFase: número de conductores de fase (1 para monofásico, 2 para bifásico, 3 para trifásico)
- neutro: código del cable neutro (mismo formato)
- cantNeutro: normalmente 1
- tierra: código del cable de tierra (normalmente 1 o 2 calibres menor)
- cantTierra: normalmente 1
- metrado: metros de cable (default 0, el usuario lo ajusta)
- repite: default 0
- bornas: default true
- Usa CA cuando el ítem mencione: cable, conductor, acometida (la parte de cable), alimentador, circuito

SA (Salidas eléctricas):
- aparato: tipo de salida (DEBE ser uno de opciones.SA.aparatos, ej: "TOMA", "ILUMINACIÓN", "DATOS")
- modo: "completa" (incluye tubo+cable+aparato) o "solo_punto" (solo mano de obra)
- matTub1, calTub1: material y calibre del tubo principal
- matTub2, calTub2: segundo tubo (opcional, para salidas con retorno)
- calCable, matCable: calibre y material del cable
- estrato: 1-6 (default 3)
- promedio: metros promedio de tubo por salida (default 5)
- caja: "OCTOGONAL" (iluminación), "CUADRADA" (tomas/datos), "HONDA" (piso)
- Usa SA cuando el ítem mencione: salida, punto eléctrico, toma, interruptor de luz, punto de iluminación, punto de datos

TA (Tableros):
- familia: tipo de tablero (DEBE ser uno de opciones.TA.tableros)
- subitem: componente del tablero (DEBE ser uno de opciones.TA.subitems)
- cantidad: default 1
- Usa TA cuando el ítem mencione: tablero, gabinete, panel de distribución, barraje, cofre

mo (Mano de obra / Módulos):
- item: actividad (DEBE ser uno de opciones.mo.items)
- cantidad: default 1
- Usa mo cuando el ítem mencione: instalación, montaje, conexión, pruebas, certificación, canaleta, bandeja portacables

# Reglas estrictas
1. SOLO usa valores exactos que aparezcan en las opciones proporcionadas
2. Si no encuentras un valor exacto en las opciones, busca el más cercano
3. Si no puedes determinar un apartado con confianza, omítelo
4. Un ítem puede necesitar varios apartados (ej: una acometida necesita TU + CA)
5. Para lotes, responde con un array donde cada elemento tiene "apu" coincidiendo con el input
6. Incluye un campo "razonamiento" explicando brevemente tu análisis

# Ejemplo de respuesta para un ítem individual
{"TU":[{"material":"PVC","tipo":"ENTERRADA","diam":"3/4\\"","cantidad":1}],"CA":[{"fase":"...","cantFase":3,"neutro":"...","cantNeutro":1,"tierra":"...","cantTierra":1,"metrado":0,"repite":0,"bornas":true}],"razonamiento":"Acometida trifásica en PVC enterrada con cables..."}`;

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
        max_tokens: 2048,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
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
