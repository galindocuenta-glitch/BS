# Backend BS Bike Store

API REST para el catálogo, las cuentas, los pedidos y las reseñas de BS Bike Store. Los precios de los pedidos se calculan en el servidor y el inventario se reserva dentro de una transacción MySQL. El backend no procesa pagos.

## Requisitos

- Node.js 20 o superior
- MySQL 8.0 o superior

## Configuración local

1. Crear la base y las tablas desde la carpeta raíz del proyecto:

   ```sh
   mysql -u root -p < SQL/schema.sql
   ```

   Si ya habías creado la base, aplica también la migración de factura e imágenes:

   ```sh
   mysql -u root -p < SQL/20261008_invoice.sql
   ```

2. En `Backend/`, instalar dependencias y crear la configuración local:

   ```sh
   npm install
   cp .env.example .env
   ```

3. Completar las credenciales MySQL, `JWT_SECRET` (mínimo 32 caracteres) y `FRONTEND_ORIGIN=http://localhost:8443`.
4. Importar el catálogo inicial. Conserva el stock actual si un producto ya existe:

   ```sh
   npm run catalog:seed
   ```

   Para validar los productos sin conectarse a MySQL, ejecutar `npm run catalog:seed -- --dry-run`.
5. Crear la cuenta administrativa. Define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno; la contraseña debe tener al menos 12 caracteres:

   ```sh
   npm run admin:create
   ```

6. Iniciar la API:

   ```sh
   npm run dev
   ```

La API queda en `http://localhost:4000/api`. Inicia el frontend con `cd Frontend && npm run dev`; Vite usa el puerto `8443` por defecto. Comprueba `/api/health` para verificar la conexión con MySQL.

Al confirmar el checkout se registra el pedido, la factura interna y la salida de inventario en una sola transacción. El pago en efectivo queda `pending`; no se cobra dinero ni se genera una factura electrónica DIAN. El usuario debe iniciar sesión con una cuenta creada en la API. La factura persistida se consulta junto con el pedido mediante `GET /api/orders/:id`.

## Endpoints

- `GET /api/health`
- `GET /api/products?category=Ruta&minPrice=1000000&maxPrice=5000000&sort=price_asc&page=1&limit=24`
- `GET /api/products/:id` y `GET /api/products/:id/reviews`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/orders`, `GET /api/orders/mine`
- `GET /api/orders/:id` (el cliente solo puede consultar sus propios pedidos)
- `POST /api/reviews`
- Administración con token Bearer y rol `admin`: `GET /api/admin/products`, `POST/PATCH/DELETE /api/products`, `GET /api/orders`, `PATCH /api/orders/:id/status`, `GET /api/admin/reviews?approved=false` y `PATCH /api/admin/reviews/:id/approval`

Para las rutas protegidas, enviar `Authorization: Bearer <token>`. Los estados de pedido aceptados por administración son `processing`, `shipped`, `delivered` y `cancelled`.

Los productos devuelven `img`, `gallery` y `specs`, además de `rating` y `reviews` calculados con reseñas aprobadas. El seed conserva las imágenes locales actuales del frontend; las imágenes agregadas desde administración se almacenan como data URI de hasta 500 KB.