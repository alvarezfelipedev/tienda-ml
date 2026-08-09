// GET /api/auth/login
// Punto de partida de la autorización única. Te redirige a MercadoLibre
// para que apruebes el acceso; MercadoLibre después te manda a
// /api/auth/callback con un código que se cambia por el primer refresh_token.

module.exports = async (req, res) => {
  const clientId = process.env.ML_CLIENT_ID;
  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res
      .status(500)
      .send(
        "Faltan ML_CLIENT_ID / ML_REDIRECT_URI en las variables de entorno de Vercel."
      );
    return;
  }

  const url =
    `https://auth.mercadolibre.com.ar/authorization?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.writeHead(302, { Location: url });
  res.end();
};
