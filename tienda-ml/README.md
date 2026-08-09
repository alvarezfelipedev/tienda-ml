# Tienda ML — catálogo web

Catálogo web de tus publicaciones de MercadoLibre, con estructura tipo
Mercado Shops: **home con grilla de productos** + **página de detalle**.

## ⚠️ Importante: por qué necesita login (y no es un capricho)

Hasta 2025 se podía consultar el catálogo de un vendedor sin ningún login
(API pública). **Desde abril de 2025, MercadoLibre cerró eso**: ahora
hasta la búsqueda y el detalle de un ítem exigen un token de acceso
autenticado. Por eso este proyecto necesita que autorices una app propia
una única vez.

## Cómo funciona (y por qué sigue siendo estable)

- Te autorizás una sola vez, con un click, contra tu propia cuenta de
  MercadoLibre (flujo OAuth estándar).
- MercadoLibre entrega un `refresh_token` que **rota cada vez que se
  usa** (te da uno nuevo y el anterior deja de servir). El proyecto lo
  guarda automáticamente en **Vercel KV** cada vez que se renueva, así
  que nunca se corta la cadena ni tenés que volver a loguearte.
- El catálogo se consulta en vivo (con una caché de 30 segundos como
  máximo): si agregás o sacás una publicación en MercadoLibre, se
  refleja solo.

## Estructura del proyecto

```
tienda-ml/
├── api/
│   ├── _lib/
│   │   ├── kv.js         → lectura/escritura en Vercel KV
│   │   └── ml-auth.js    → mantiene el access_token vigente
│   ├── auth/
│   │   ├── login.js      → arranca la autorización con MercadoLibre
│   │   └── callback.js   → recibe el code y guarda el primer refresh_token
│   ├── products.js       → catálogo completo
│   └── product.js        → detalle de un producto
├── index.html             → home (grilla de productos + buscador)
├── product.html            → página de detalle de producto
├── css/styles.css
└── js/
    ├── app.js             → lógica de la home
    └── product.js         → lógica del detalle
```

## Configuración — paso a paso

### 1. Creá una aplicación en MercadoLibre

Entrá a https://developers.mercadolibre.com.ar/devcenter → **Crear
aplicación**. Te va a pedir:
- **Redirect URI**: por ahora poné un valor cualquiera con https (por
  ejemplo `https://tu-proyecto.vercel.app/api/auth/callback`) — lo vas
  a corregir después de tener la URL definitiva de Vercel.
- Scopes: `read` alcanza.

Guardate el **Client ID** y el **Client Secret**.

### 2. Conseguí tu seller_id

En el mismo devcenter, o consultando:
`https://api.mercadolibre.com/users/search?nickname=TU_NICKNAME`
— el campo `id` es tu `seller_id`.

### 3. Subí el proyecto a Vercel

1. Subí esta carpeta a un repo de GitHub.
2. En Vercel: **New Project** → importá el repo (no hace falta build
   command, Vercel lo detecta solo).
3. Anotá la URL que te asigna Vercel (ej. `tienda-ml-felipe.vercel.app`).

### 4. Conectá un Vercel KV Store

En el proyecto en Vercel: **Storage → Create Database → KV** (es
gratis en el plan Hobby). Al conectarlo al proyecto, Vercel agrega
solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.

### 5. Variables de entorno

En **Settings → Environment Variables**, agregá:

| Variable | Valor |
|---|---|
| `ML_CLIENT_ID` | el Client ID del paso 1 |
| `ML_CLIENT_SECRET` | el Client Secret del paso 1 |
| `ML_SELLER_ID` | tu seller_id del paso 2 |
| `ML_REDIRECT_URI` | `https://TU-URL-DE-VERCEL/api/auth/callback` |

Volvé al devcenter de MercadoLibre y corregí el **Redirect URI** de tu
app para que coincida exactamente con `ML_REDIRECT_URI`.

Redeployá el proyecto para que tome las variables nuevas.

### 6. Autorizá tu cuenta (una sola vez)

Entrá a `https://TU-URL-DE-VERCEL/api/auth/login`, iniciá sesión con tu
cuenta de MercadoLibre y aceptá los permisos. Te va a redirigir de
vuelta confirmando la conexión. A partir de ahí la tienda ya muestra tu
catálogo real, y se va a mantener conectada sola.

## Probar en local

```bash
npm install -g vercel
vercel dev
```

Necesitás un archivo `.env` local con `ML_CLIENT_ID`, `ML_CLIENT_SECRET`,
`ML_SELLER_ID`, `ML_REDIRECT_URI` (usando `http://localhost:3000/api/auth/callback`)
y las variables de KV (podés usar el mismo KV Store de producción o
crear uno de prueba).

## Personalización rápida

- **Nombre de la tienda / tagline**: bloque `.nameplate` en `index.html`
  y `product.html`.
- **Colores**: variables CSS al principio de `css/styles.css`.
- **Paginado**: la home no pagina, muestra todo el catálogo activo
  (hasta 1000 publicaciones). Avisame si necesitás paginado.
