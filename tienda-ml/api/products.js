// GET /api/products
// Devuelve el catálogo completo de publicaciones activas del vendedor.
// Desde abril de 2025 MercadoLibre exige un access_token válido incluso
// para esta consulta, así que pasa por getAccessToken() antes de pegarle
// a la API. Igual sigue siendo "en vivo": no hay caché de tu catálogo más
// allá de 30 segundos, así que agregar o sacar un producto en MercadoLibre
// se refleja solo, sin redeploy.

const { getAccessToken } = require("./_lib/ml-auth");

let cache = { data: null, ts: 0 };
const CACHE_TTL_MS = 30 * 1000;

function mapItem(it) {
  return {
    id: it.id,
    title: it.title,
    price: it.price,
    currency: it.currency_id,
    thumbnail: (it.thumbnail || "").replace("http://", "https://"),
    availableQuantity: it.available_quantity,
    soldQuantity: it.sold_quantity,
    permalink: it.permalink,
    condition: it.condition,
    freeShipping: Boolean(it.shipping && it.shipping.free_shipping),
  };
}

async function fetchItemIds(sellerId, token) {
  const ids = [];
  const limit = 50;
  let offset = 0;
  let total = Infinity;

  while (offset < total && offset < 1000) {
    const url = `https://api.mercadolibre.com/users/${encodeURIComponent(
      sellerId
    )}/items/search?status=active&limit=${limit}&offset=${offset}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`No se pudo listar publicaciones (${r.status})`);
    const json = await r.json();
    total = (json.paging && json.paging.total) || 0;
    if (!json.results || json.results.length === 0) break;
    ids.push(...json.results);
    offset += limit;
  }
  return ids;
}

async function fetchItemsDetails(ids, token) {
  const items = [];
  const chunkSize = 20; // límite del multiget de MercadoLibre
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const url = `https://api.mercadolibre.com/items?ids=${chunk.join(",")}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`No se pudo obtener el detalle de los productos (${r.status})`);
    const json = await r.json();
    for (const entry of json) {
      if (entry.code === 200 && entry.body) items.push(mapItem(entry.body));
    }
  }
  return items;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

  const sellerId = process.env.ML_SELLER_ID;
  if (!sellerId) {
    res.status(500).json({ error: "Falta configurar ML_SELLER_ID en Vercel." });
    return;
  }

  if (req.query.fresh !== "1" && cache.data && Date.now() - cache.ts < CACHE_TTL_MS) {
    res.status(200).json(cache.data);
    return;
  }

  try {
    const token = await getAccessToken();
    const ids = await fetchItemIds(sellerId, token);
    const items = await fetchItemsDetails(ids, token);

    const data = { items, updatedAt: new Date().toISOString() };
    cache = { data, ts: Date.now() };
    res.status(200).json(data);
  } catch (err) {
    if (cache.data) {
      res.status(200).json(cache.data);
      return;
    }
    const notConnected = String(err.message).startsWith("NOT_CONNECTED");
    res.status(notConnected ? 401 : 502).json({
      error: notConnected
        ? "Todavía no conectaste tu cuenta de MercadoLibre. Entrá a /api/auth/login para autorizarla."
        : "No se pudo obtener el catálogo: " + err.message,
      needsAuth: notConnected,
    });
  }
};
