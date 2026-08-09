// MercadoLibre exige, desde abril de 2025, un access_token válido para
// CUALQUIER llamada de lectura (búsquedas e ítems dejaron de ser públicos).
// Este helper mantiene ese token vivo:
//
// - El access_token dura ~6hs: se cachea en memoria del proceso mientras
//   valga (esto es gratis, no pega contra la red).
// - El refresh_token ROTA en cada uso: MercadoLibre invalida el anterior
//   y entrega uno nuevo, que hay que guardar sí o sí o se corta la cadena.
//   Por eso se persiste en Vercel KV en vez de en una variable de entorno
//   (las env vars no se pueden reescribir en runtime).

const { kvGet, kvSet } = require("./kv");

let memCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken() {
  if (memCache.accessToken && Date.now() < memCache.expiresAt) {
    return memCache.accessToken;
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan las variables de entorno ML_CLIENT_ID / ML_CLIENT_SECRET."
    );
  }

  const refreshToken = await kvGet("ml_refresh_token");
  if (!refreshToken) {
    throw new Error(
      "NOT_CONNECTED: todavía no conectaste tu cuenta de MercadoLibre. Entrá a /api/auth/login para autorizarla."
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const r = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const json = await r.json();

  if (!r.ok) {
    throw new Error(
      `No se pudo renovar el token de MercadoLibre (${r.status}): ${json.message || JSON.stringify(json)}`
    );
  }

  // Guardar el refresh_token nuevo ANTES de devolver el access_token:
  // si esto falla, mejor cortar acá que quedarnos con uno viejo ya inválido.
  await kvSet("ml_refresh_token", json.refresh_token);

  memCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 120) * 1000,
  };

  return memCache.accessToken;
}

module.exports = { getAccessToken };
