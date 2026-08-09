// GET /api/auth/callback?code=...
// MercadoLibre redirige acá después de que autorizás la app.
// Cambia el "code" por el primer refresh_token y lo guarda en Vercel KV.
// Después de esto, ml-auth.js se encarga solo de mantenerlo vigente.

const { kvSet } = require("../_lib/kv");

module.exports = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.status(400).send(`MercadoLibre devolvió un error: ${error}`);
    return;
  }
  if (!code) {
    res.status(400).send("Falta el parámetro code en la URL.");
    return;
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    res
      .status(500)
      .send("Faltan ML_CLIENT_ID / ML_CLIENT_SECRET / ML_REDIRECT_URI en las variables de entorno.");
    return;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  try {
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
      res.status(502).send(`<pre>Error al obtener el token:\n${JSON.stringify(json, null, 2)}</pre>`);
      return;
    }

    await kvSet("ml_refresh_token", json.refresh_token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
      <html><body style="font-family: system-ui, sans-serif; padding: 48px; max-width: 480px; margin: 0 auto;">
        <h2>Cuenta de MercadoLibre conectada ✅</h2>
        <p>Ya podés cerrar esta pestaña. El catálogo va a mostrar tus productos a partir de ahora.</p>
        <p>Esta autorización queda guardada — no hace falta repetir este paso salvo que revoques el acceso desde tu cuenta de MercadoLibre.</p>
        <a href="/">Ir a la tienda →</a>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send("Error inesperado: " + err.message);
  }
};
