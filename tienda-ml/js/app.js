(function () {
  const grid = document.getElementById("grid");
  const countLabel = document.getElementById("count-label");
  const updatedLabel = document.getElementById("updated-label");
  const footerCount = document.getElementById("footer-count");
  const searchInput = document.getElementById("search");

  let allItems = [];

  function money(price, currency) {
    const cur = currency === "USD" ? "US$" : "$";
    return `<span class="cur">${cur}</span>${Number(price).toLocaleString("es-AR")}`;
  }

  function cardHTML(item) {
    const inStock = item.availableQuantity > 0;
    return `
      <a class="card" href="product.html?id=${encodeURIComponent(item.id)}">
        <div class="thumb">
          <img src="${item.thumbnail}" alt="${escapeHTML(item.title)}" loading="lazy" />
        </div>
        <div class="body">
          <div class="title">${escapeHTML(item.title)}</div>
          ${item.freeShipping ? '<span class="shipping-badge">ENVÍO GRATIS</span>' : ""}
          <div class="specstrip">
            <span class="price">${money(item.price, item.currency)}</span>
            <span class="led-status">
              <span class="led-dot ${inStock ? "on" : ""}"></span>
              ${inStock ? "disponible" : "sin stock"}
            </span>
          </div>
        </div>
      </a>`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render(items) {
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No hay productos que coincidan con la búsqueda.</div>`;
      return;
    }
    grid.innerHTML = items.map(cardHTML).join("");
  }

  function applyFilter() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q
      ? allItems.filter((i) => i.title.toLowerCase().includes(q))
      : allItems;
    render(filtered);
    countLabel.textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`;
  }

  searchInput.addEventListener("input", applyFilter);

  async function load() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar el catálogo");

      allItems = data.items || [];
      applyFilter();
      footerCount.textContent = `${allItems.length} productos publicados`;
      if (data.updatedAt) {
        const t = new Date(data.updatedAt);
        updatedLabel.textContent = `actualizado ${t.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
      }
    } catch (err) {
      grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;">No se pudo cargar el catálogo. ${escapeHTML(err.message)}</div>`;
      countLabel.textContent = "Error";
    }
  }

  load();
})();
