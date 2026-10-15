"use strict";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const reply = (statusCode, obj) => ({ statusCode, headers: corsHeaders, body: JSON.stringify(obj) });

const SYSTEM_PROMPT = `Eres un asistente de ingeniería eléctrica para presupuestos en Colombia.

Dada la descripción de ítems de un presupuesto eléctrico, sugiere la composición del APU usando SOLO los valores de las opciones proporcionadas.

Apartados y campos:

TU (Tuberías): material (de opciones.TU.familias), tipo (de opciones.TU.tipos), diam (de opciones.TU.diametros), cantidad (default 1)

EQ (Equipos): familia (de opciones.EQ.familias), subfamilia (de opciones.EQ.subfamilias), cantidad (default 1)

CA (Cableados): fase (código de opciones.CA.cables[].cod), cantFase, neutro (código), cantNeutro, tierra (código), cantTierra, metrado (metros), repite (default 0), bornas (default true)

SA (Salidas): aparato (de opciones.SA.aparatos), modo ("completa" o "solo_punto"), matTub1 (opciones.SA.materiales), calTub1 (opciones.SA.tubos), matTub2 (opcional), calTub2 (opcional), calCable (opciones.SA.calibres), matCable (opciones.SA.matCable), estrato (1-6, default 3), promedio (metros, default 5), caja ("OCTOGONAL"/"CUADRADA"/"HONDA")

TA (Tableros): familia (opciones.TA.tableros), subitem (opciones.TA.subitems), cantidad (default 1)

mo (Módulos): item (opciones.mo.items), cantidad (default 1)

Reglas:
1. SOLO usa valores que existan en las opciones
2. Si no puedes determinar un apartado, omítelo
3. Responde SOLO con JSON válido, sin markdown
4. Para lotes, responde con un array JSON donde cada elemento tiene un campo "apu" que coincide con el del input
5. Incluye un campo "razonamiento" con una explicación breve`;

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
        "anthropic-beta": "prompt-caching-2024-07-31",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2048,
        temperature: 0,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: JSON.stringify(body) }],
      }),
    });
    data = await res.json();
  } catch (e) {
    return reply(502, { error: "Fallo al llamar a Anthropic: " + e.message });
  }

  if (!res.ok) return reply(res.status, { error: data.error || data });

  const text = (data.content && data.content[0] && data.content[0].text) || "";
  try {
    return reply(200, { sugerencia: JSON.parse(text), usage: data.usage });
  } catch (e) {
    return reply(200, { raw: text, error: "La respuesta no es JSON válido", usage: data.usage });
  }
};
