# Tienda ML — catálogo web

Catálogo web de tus publicaciones de MercadoLibre, con estructura tipo
Mercado Shops: **home con grilla de productos** + **página de detalle**.

## Cómo funciona (y por qué es estable)

No usa OAuth ni tokens de acceso: consulta la **API pública** de
MercadoLibre (`/sites/MLA/search?seller_id=...` y `/items/{id}`), que no
requiere login ni credenciales que expiren. Esto significa:

- No hay tokens que renovar ni que se rompan con el tiempo.
- Cada vez que entrás a la web (o refrescás), se consulta el catálogo
  real de tu cuenta. Si agregaste o sacaste una publicación en
  MercadoLibre, se refleja solo — no hay que reconstruir ni redeployar
  nada.
- Hay una caché corta de 30 segundos en el servidor para no golpear la
  API en cada visita, pero nunca queda "vieja" por más de eso.

## Estructura del proyecto

```
tienda-ml/
├── api/
│   ├── products.js   → función serverless: catálogo completo
│   └── product.js    → función serverless: detalle de un producto
├── index.html         → home (grilla de productos + buscador)
├── product.html        → página de detalle de producto
├── css/styles.css
└── js/
    ├── app.js         → lógica de la home
    └── product.js     → lógica del detalle
```

## Configuración

Solo necesitás UNA variable de entorno: tu `user_id` (seller_id) de
MercadoLibre.

**Cómo encontrar tu seller_id:**
Andá a cualquiera de tus publicaciones activas y mirá el link "Ver más
info del vendedor", o entrá a:
`https://api.mercadolibre.com/users/search?nickname=TU_NICKNAME`
Ahí el campo `id` es tu seller_id. 798153629

## Deploy en Vercel

1. Subí esta carpeta a un repo de GitHub (por ejemplo
   `alvarezfelipedev/tienda-ml`).
2. En Vercel: **New Project** → importá el repo. No hace falta build
   command ni output directory (es un proyecto estático + funciones
   serverless, Vercel lo detecta solo).
3. En **Settings → Environment Variables**, agregá:
   - `ML_SELLER_ID` = tu seller_id de MercadoLibre
4. Deploy. Listo — la URL que te da Vercel ya sirve la tienda completa.

## Probar en local

```bash
npm install -g vercel
vercel dev
```

Esto levanta tanto el sitio estático como las funciones de `/api` en
`http://localhost:3000`. Necesitás tener `ML_SELLER_ID` en un archivo
`.env` local (`ML_SELLER_ID=123456789`).

## Personalización rápida

- **Nombre de la tienda / tagline**: editá el bloque `.nameplate` en
  `index.html` y `product.html`.
- **Colores**: variables CSS al principio de `css/styles.css` (`--bg`,
  `--accent`, etc.).
- **Cantidad de productos por página**: la home no pagina, muestra
  todo el catálogo activo (hasta 400 publicaciones). Si tenés más,
  avisame y agrego paginado.
