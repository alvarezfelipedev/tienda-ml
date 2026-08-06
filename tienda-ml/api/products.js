// GET /api/products
// Devuelve el catálogo completo de publicaciones activas del vendedor.
// Usa la API pública de búsqueda de MercadoLibre (sin OAuth), así que no
// hay tokens que expiren ni credenciales que romper: cada visita a la
// tienda refleja el estado real y actual de tu cuenta de MercadoLibre.

let cache = { data: null, ts: 0 };
const CACHE_TTL_MS = 30 * 1000; // 30s: suficiente para no golpear la API en cada refresh, sin sentirse "viejo"

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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

  const sellerId = process.env.ML_SELLER_ID;
  if (!sellerId) {
    res.status(500).json({
      error:
        "Falta configurar la variable de entorno ML_SELLER_ID en Vercel (tu user_id de MercadoLibre).",
    });
    return;
  }

  if (req.query.fresh !== "1" && cache.data && Date.now() - cache.ts < CACHE_TTL_MS) {
    res.status(200).json(cache.data);
    return;
  }

  try {
    const items = [];
    const limit = 50;
    let offset = 0;
    let total = Infinity;

    while (offset < total && offset < 400) {
      const url = `https://api.mercadolibre.com/sites/MLA/search?seller_id=${encodeURIComponent(
        sellerId
      )}&limit=${limit}&offset=${offset}`;
      const r = await fetch(url);
      if (!r.ok) {
        throw new Error(`La API de MercadoLibre respondió ${r.status}`);
      }
      const json = await r.json();
      total = (json.paging && json.paging.total) || 0;
      if (!json.results || json.results.length === 0) break;
      items.push(...json.results.map(mapItem));
      offset += limit;
    }

    const data = { items, updatedAt: new Date().toISOString() };
    cache = { data, ts: Date.now() };
    res.status(200).json(data);
  } catch (err) {
    if (cache.data) {
      // Si falla la API pero tenemos algo en caché, mejor mostrar eso que romper la web.
      res.status(200).json(cache.data);
      return;
    }
    res.status(502).json({ error: "No se pudo obtener el catálogo de MercadoLibre: " + err.message });
  }
};
