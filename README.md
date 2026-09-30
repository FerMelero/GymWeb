# 🏋️ GymWeb

Sistema de control de acceso para gimnasios. Cada socio tiene un código QR personal que se escanea en recepción para registrar su **entrada y salida**. Los socios consultan su perfil e historial, y el administrador dispone de un panel en tiempo real.

## Funcionalidades

**Socios**
- Registro e inicio de sesión (con email o nombre de usuario).
- Perfil con sus datos, estadísticas de visitas e historial de entrenamientos.
- Código QR personal: visualizable, descargable y copiable.

**Administrador**
- Panel con usuarios registrados, entradas del día y quién está dentro ahora (se actualiza cada 15 s).
- Escáner de QR por cámara, o introduciendo el código a mano, con aviso sonoro y visual.
- La primera lectura de un QR registra la **entrada**; la siguiente, la **salida** (con duración de la sesión).

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT + bcrypt, roles `user` / `admin` |
| Frontend | HTML, CSS y JavaScript sin framework |
| Librerías | `qrcodejs` (generar QR), `html5-qrcode` (leer QR) |

## Estructura

```
GymWeb/
├── backend/
│   └── src/
│       ├── server.js          # Servidor, helmet, rate limit, rutas
│       ├── config/            # Cliente de Supabase
│       ├── middleware/        # authMiddleware, adminMiddleware
│       ├── routes/            # auth, users, entries
│       └── controllers/       # Lógica de cada ruta
└── frontend/                  # Páginas estáticas servidas por Express
    ├── login.html · register.html
    ├── profile.html           # Vista del socio
    ├── admin.html             # Panel de administración
    ├── scanner.html           # Escáner de QR (admin)
    └── js/ · styles.css
```

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Crear cuenta |
| POST | `/api/auth/login` | Público | Iniciar sesión, devuelve JWT |
| GET | `/api/users/me` | Usuario | Mi perfil |
| POST | `/api/users/me/qr` | Usuario | Regenerar mi QR |
| GET | `/api/users` | Admin | Listar usuarios |
| POST | `/api/entries` | Admin | Registrar entrada/salida por QR |
| GET | `/api/entries` | Usuario | Mi historial (el admin ve todos) |
| GET | `/api/entries/today` | Admin | Entradas de hoy |
| GET | `/api/entries/inside` | Admin | Quién está dentro ahora |

Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

## Puesta en marcha

1. **Instalar dependencias**
   ```bash
   cd backend
   npm install
   ```

2. **Crear `backend/.env`**
   ```env
   PORT=5000
   SUPABASE_URL=https://TU_PROYECTO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key   # solo en el servidor, nunca en el frontend
   JWT_SECRET=una_cadena_larga_y_aleatoria_de_32+_caracteres
   ```

3. **Preparar la base de datos en Supabase**

   Tablas `users` (`id`, `email`, `password_hash`, `nombre`, `telefono`, `username`, `rol`, `activo`, `qr_code`, `created_at`) y `entries` (`id`, `user_id`, `entrada_timestamp`, `salida_timestamp`), y después:
   ```sql
   alter table users add constraint users_email_key    unique (email);
   alter table users add constraint users_username_key unique (username);
   alter table users add constraint users_qr_code_key  unique (qr_code);
   create unique index entries_one_open_per_user on entries (user_id) where salida_timestamp is null;
   alter table users   enable row level security;
   alter table entries enable row level security;
   ```

4. **Arrancar**
   ```bash
   npm start          # o: npm run dev
   ```
   Abre `http://localhost:5000/login.html`. Para crear un administrador, cambia el campo `rol` a `admin` de un usuario directamente en Supabase.

## Seguridad

- Contraseñas con **bcrypt**; login resistente a inyección de filtros y a enumeración de usuarios por tiempo de respuesta.
- **JWT** de 8 h; el rol y el estado activo se revalidan en la BD en cada petición.
- Rutas de administración, escáner y datos de otros socios protegidas en el servidor.
- `helmet` (CSP y cabeceras), límite de intentos en login/registro y límite general de la API.
- **RLS activado** en Supabase: el acceso a los datos solo se hace desde el backend con la `service_role` key.
- En producción, servir siempre por **HTTPS** (la cámara del escáner lo exige fuera de localhost).

## Estado y próximos pasos

- Validación del registro en el servidor (con `zod`).
- Servir `qrcodejs` y `html5-qrcode` en local en lugar de por CDN.
- Botón para regenerar el QR en el perfil.
