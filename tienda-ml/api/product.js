// GET /api/product?id=MLAxxxxxxxxx
// Devuelve el detalle completo de una publicación puntual.

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Falta el parámetro id" });
    return;
  }

  try {
    const itemRes = await fetch(`https://api.mercadolibre.com/items/${encodeURIComponent(id)}`);
    if (!itemRes.ok) {
      res.status(itemRes.status === 404 ? 404 : 502).json({
        error: itemRes.status === 404 ? "Ese producto no existe o ya no está activo." : "Error al consultar MercadoLibre.",
      });
      return;
    }
    const item = await itemRes.json();

    let description = "";
    try {
      const descRes = await fetch(
        `https://api.mercadolibre.com/items/${encodeURIComponent(id)}/description`
      );
      if (descRes.ok) {
        const descJson = await descRes.json();
        description = descJson.plain_text || descJson.text || "";
      }
    } catch (_) {
      // La descripción es opcional: si falla, seguimos sin ella.
    }

    res.status(200).json({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency_id,
      condition: item.condition,
      availableQuantity: item.available_quantity,
      soldQuantity: item.sold_quantity,
      pictures: (item.pictures || []).map((p) => p.secure_url || p.url),
      attributes: (item.attributes || [])
        .filter((a) => a.value_name)
        .map((a) => ({ name: a.name, value: a.value_name })),
      permalink: item.permalink,
      freeShipping: Boolean(item.shipping && item.shipping.free_shipping),
      description,
    });
  } catch (err) {
    res.status(502).json({ error: "No se pudo obtener el producto: " + err.message });
  }
};
