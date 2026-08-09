// Wrapper mínimo sobre la REST API de Upstash que usa Vercel KV.
// No depende de ningún paquete npm: solo fetch + las dos variables
// que Vercel inyecta solas cuando conectás un KV Store al proyecto.

// Según cómo Vercel arme la integración con Upstash, las variables pueden
// llegar como KV_REST_API_* (nombre heredado de la vieja "Vercel KV") o
// como UPSTASH_REDIS_REST_* (nombre nativo de Upstash). Soportamos las dos.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json.result ?? null;
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error("Falta conectar una base Redis (Upstash) al proyecto desde Storage en Vercel.");
  }
  const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!r.ok) {
    throw new Error("No se pudo guardar en Vercel KV: " + (await r.text()));
  }
}

module.exports = { kvGet, kvSet };
