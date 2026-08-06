(function () {
  const root = document.getElementById("detail-root");

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function money(price, currency) {
    const cur = currency === "USD" ? "US$" : "$";
    return `<span class="cur">${cur}</span>${Number(price).toLocaleString("es-AR")}`;
  }

  function renderError(message) {
    root.innerHTML = `<div class="error-state" style="grid-column:1/-1;">${escapeHTML(message)}<br/><br/><a href="index.html">&larr; Volver al catálogo</a></div>`;
  }

  function renderProduct(item) {
    document.title = `${item.title} — Catálogo`;

    const pictures = item.pictures && item.pictures.length ? item.pictures : [];
    const mainPic = pictures[0] || "";
    const inStock = item.availableQuantity > 0;

    const specRows = (item.attributes || [])
      .map((a) => `<tr><td>${escapeHTML(a.name)}</td><td>${escapeHTML(a.value)}</td></tr>`)
      .join("");

    root.innerHTML = `
      <div class="gallery">
        <div class="main-shot">
          ${mainPic ? `<img id="main-img" src="${mainPic}" alt="${escapeHTML(item.title)}" />` : ""}
        </div>
        ${
          pictures.length > 1
            ? `<div class="thumbstrip">${pictures
                .map(
                  (p, i) =>
                    `<button data-src="${p}" class="${i === 0 ? "active" : ""}"><img src="${p}" alt="" /></button>`
                )
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="spec-panel">
        <div class="condition-tag">${item.condition === "new" ? "Nuevo" : "Usado"} · ${escapeHTML(item.id)}</div>
        <h1>${escapeHTML(item.title)}</h1>
        <div class="price-row">
          <span class="price">${money(item.price, item.currency)}</span>
          <span class="led-status">
            <span class="led-dot ${inStock ? "on" : ""}"></span>
            ${inStock ? `${item.availableQuantity} disponibles` : "sin stock"}
          </span>
        </div>
        <div class="sold">${item.soldQuantity || 0} vendidos${item.freeShipping ? " · envío gratis" : ""}</div>

        <a class="buy-btn" href="${item.permalink}" target="_blank" rel="noopener noreferrer">
          Comprar en MercadoLibre
        </a>

        ${
          specRows
            ? `<div class="spec-table-wrap">
                <div class="rail-label">Ficha técnica</div>
                <table class="spec-table">${specRows}</table>
              </div>`
            : ""
        }

        ${
          item.description
            ? `<div class="description-block">
                <div class="rail-label">Descripción</div>
                <p>${escapeHTML(item.description)}</p>
              </div>`
            : ""
        }
      </div>
    `;

    const thumbButtons = root.querySelectorAll(".thumbstrip button");
    const mainImg = document.getElementById("main-img");
    thumbButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        mainImg.src = btn.dataset.src;
        thumbButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      renderError("Falta el identificador del producto.");
      return;
    }
    try {
      const res = await fetch(`/api/product?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el producto");
      renderProduct(data);
    } catch (err) {
      renderError(err.message);
    }
  }

  load();
})();
