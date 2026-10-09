# 🏋️ GymWeb

Sistema de control de acceso para gimnasios. Cada socio tiene un código QR personal que se escanea en recepción para registrar su **entrada y salida**. Los socios consultan su perfil e historial, y el administrador dispone de un panel en tiempo real.

## Funcionalidades

**Socios**
- Registro e inicio de sesión (con email o nombre de usuario).
- Perfil con sus datos, estadísticas de visitas e historial de entrenamientos.
- Código QR personal: visualizable, descargable y copiable.
- **Edición de toda su información**: nombre, usuario, email, teléfono, dirección y datos de facturación, más cambio de contraseña.

**Administrador**
- Panel con usuarios registrados, entradas del día y quién está dentro ahora (se actualiza cada 15 s).
- Escáner de QR por cámara, o introduciendo el código a mano, con aviso sonoro y visual.
- **Auditoría:** pantalla con todas las acciones sobre cuentas (quién, a quién, qué y cuándo), con filtros y paginación.
- **Corrección de datos de los socios**: teléfono, email, dirección y nombre, y datos de facturación (nombre fiscal, NIF/CIF y dirección de cobro). El usuario, la contraseña y el rol no se pueden tocar desde el panel.
- **Desactivar, reactivar y eliminar cuentas** de socios, con confirmación y registro en la auditoría.
- La primera lectura de un QR registra la **entrada**; la siguiente, la **salida** (con duración de la sesión).

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, `helmet`, `express-rate-limit`, `zod` |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT + bcrypt, roles `user` / `admin` / `scanner` |
| Frontend | HTML, CSS y JavaScript sin framework |
| Librerías | `qrcodejs` (generar QR) y `html5-qrcode` (leer QR), servidas desde `frontend/vendor` |

## Estructura

```
GymWeb/
├── backend/
│   ├── .env.example           # Plantilla de variables de entorno
│   ├── sql/                   # Scripts para Supabase (columnas, auditoría, borrado de cuentas)
│   └── src/
│       ├── server.js          # Servidor, helmet, límites de intentos, rutas, 404
│       ├── config/            # Cliente de Supabase
│       ├── middleware/        # authMiddleware, adminMiddleware, scannerMiddleware
│       ├── routes/            # auth, users, entries, audit
│       ├── controllers/       # Lógica de cada ruta
│       └── utils/             # Validación de NIF/CIF
└── frontend/                  # Páginas estáticas servidas por Express
    ├── login.html · register.html
    ├── profile.html           # Vista del socio
    ├── admin.html             # Panel de administración
    ├── audit.html             # Registro de auditoría (admin)
    ├── scanner.html           # Escáner de QR (admin o scanner)
    ├── 403.html · 404.html    # Páginas de error
    ├── vendor/                # Librerías de QR (sin CDN)
    └── js/ · styles.css
```

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Crear cuenta |
| POST | `/api/auth/login` | Público | Iniciar sesión, devuelve JWT |
| GET | `/api/users/me` | Usuario | Mi perfil |
| PATCH | `/api/users/me` | Usuario | Editar mis datos (email/usuario piden la contraseña actual) |
| PATCH | `/api/users/me/password` | Usuario | Cambiar mi contraseña |
| POST | `/api/users/me/qr` | Usuario | Regenerar mi QR |
| GET | `/api/users/:id` | Admin | Ver un usuario con sus datos de facturación |
| PATCH | `/api/users/:id` | Admin | Corregir contacto y facturación de un usuario |
| PATCH | `/api/users/:id/status` | Admin | Activar o desactivar una cuenta |
| DELETE | `/api/users/:id` | Admin | Eliminar una cuenta y su historial |
| GET | `/api/audit` | Admin | Consultar el registro de auditoría (paginado, con filtros) |
| GET | `/api/users` | Admin | Listar usuarios |
| POST | `/api/entries` | Admin o Scanner | Registrar entrada/salida por QR |
| GET | `/api/entries` | Usuario | Mi historial (el admin ve todos) |
| GET | `/api/entries/today` | Admin | Entradas de hoy |
| GET | `/api/entries/inside` | Admin | Quién está dentro ahora |

Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

## Edición de datos: qué se puede cambiar y por qué

| Campo | Usuario (los suyos) | Admin (de cualquiera) |
|---|---|---|
| Nombre, teléfono, dirección postal | ✅ | ✅ |
| Email | ✅ con contraseña actual | ✅ |
| Nombre fiscal, NIF/CIF, dirección de cobro | ✅ | ✅ solo si confirma que lo pidió el cliente |
| Usuario (login) | ✅ con contraseña actual | ❌ |
| Contraseña | ✅ con contraseña actual | ❌ |
| Rol | ❌ | ❌ |
| Estado (activar/desactivar) | ❌ | ✅ con botón propio, nunca sobre admins ni sobre sí mismo |

**Por qué así**
- **Lista blanca estricta:** cada ruta valida el cuerpo con `zod` en modo estricto y rechaza cualquier campo que no esté previsto. Mandar `{"rol":"admin"}` a `PATCH /api/users/me` devuelve 400, así que nadie puede subirse de privilegios editando su perfil.
- **El admin no toca accesos:** puede corregir erratas y actualizar datos comerciales, pero no cambiar el usuario, el rol ni la contraseña de otra persona. Eso evita que una cuenta de admin comprometida sirva para apropiarse de cuentas ajenas. El único control sobre el acceso es activar o desactivar la cuenta (ver más abajo).
- **Facturación bajo petición del cliente:** si el admin modifica nombre fiscal, NIF/CIF o dirección de cobro, el formulario exige marcar *"el cliente ha solicitado este cambio"* y el servidor lo comprueba también.
- **Email y usuario piden contraseña:** son los datos con los que se inicia sesión; sin esa comprobación, una sesión abierta olvidada bastaría para quedarse con la cuenta.
- **NIF/CIF validado de verdad:** se comprueba el formato y el dígito de control de DNI, NIE y CIF, no solo que "parezca" uno.
- **Solo se guardan los cambios reales:** si no cambia nada, no se escribe en la BD ni se audita.
- **Auditoría:** cada edición queda en la tabla `audit_log` (quién, a quién, qué campos y cuándo; no se guardan los valores para no duplicar datos personales).
- **Rate limit:** 20 intentos cada 15 min en las rutas de edición, porque piden la contraseña actual y no deben servir para adivinarla.

### Desactivar y eliminar cuentas (admin)

Desde la tabla de socios, cada fila tiene un botón para **desactivar/reactivar** y otro para **eliminar**. Ambos piden confirmación en una ventana y quedan registrados en `audit_log`.

| Acción | Qué hace | Auditoría (`action`) |
|---|---|---|
| Desactivar | La cuenta no puede iniciar sesión ni fichar; sus sesiones abiertas dejan de valer al instante. Si estaba dentro del gimnasio, su entrada se cierra | `admin_deactivate_user` |
| Reactivar | Vuelve a poder entrar | `admin_activate_user` |
| Eliminar | Borra la cuenta y todo su historial de accesos | `admin_delete_user` |

**Por qué así**
- **Desactivar antes que eliminar:** es reversible y conserva el historial. Eliminar es la opción irreversible, por eso la ventana pide escribir el nombre de usuario exacto (y el servidor lo vuelve a comprobar).
- **Cerrar la entrada al desactivar:** una cuenta desactivada ya no puede escanear su salida; sin este paso aparecería como "dentro" para siempre en el panel.
- **Un admin no puede actuar sobre cuentas de administrador, ni sobre la suya:** evita quedarse sin acceso y que una cuenta de admin comprometida pueda bloquear a las demás. Las cuentas admin se gestionan a mano en Supabase.
- **Borrado atómico:** la cuenta, su historial y el registro de auditoría se escriben en una única transacción (función `delete_user_cascade`, ver [backend/sql/baja_usuarios.sql](backend/sql/baja_usuarios.sql)). Si algo falla, no se borra nada a medias. Solo el backend puede ejecutarla.
- **Auditoría sin datos personales:** al eliminar solo se guarda el usuario y el rol, no el resto de datos de la persona.
- **Rate limit:** 60 acciones cada 15 min.

### Pantalla de auditoría

En `/audit.html` (solo admin) se consulta el registro de `audit_log`. Cada fila muestra la fecha, el tipo de acción, quién la hizo, a qué cuenta afectó y un resumen de lo que cambió.

- **Filtros:** por tipo de acción, por nombre de usuario (busca como autor o como cuenta afectada) y por rango de fechas. Combinables, con paginación de 25 en 25.
- **Cuentas eliminadas:** el registro conserva su nombre de usuario, así que la fila sigue siendo legible ("Cuenta eliminada (@usuario)"). Al buscar por usuario no aparecen las acciones de cuentas que ya no existen.
- **Qué se guarda y qué no:** solo los nombres de los campos modificados, nunca sus valores, para no duplicar datos personales en la auditoría.
- **Seguridad:** la ruta valida todos los filtros (el usuario solo admite letras, números, `_` y `.`), solo responde a administradores y es de solo lectura; el registro no se puede modificar ni borrar desde la web.

**Formularios:** abren en una ventana modal con el mismo estilo del resto de la web. Marcan el campo con el error y explican qué pasa, muestran el progreso ("Guardando cambios…"), confirman el resultado (verde si se guardó, rojo si falló, con el motivo) y distinguen un fallo de validación de uno de conexión. El botón de guardar solo se activa si hay cambios.

## Escáner de recepción (tablet o segundo dispositivo)

El escáner está pensado para dejarse abierto en una tablet de recepción. Para eso se incluyen tres piezas, cada una con su motivo.

### 1. Rol `scanner` (cuenta dedicada)

**Qué es:** un tercer rol, además de `user` y `admin`, que solo puede llamar a `POST /api/entries`. El resto de la API (panel, listado de usuarios, historiales de otros socios) le devuelve 403.

**Por qué:** la alternativa era dejar una sesión de administrador abierta en recepción, y una tablet a la vista de todos es el dispositivo más fácil de perder o manipular. Con una cuenta `scanner`, el peor caso es que alguien fiche a socios; no puede ver datos personales ni administrar nada. Además se puede cortar al instante poniendo `activo = false` en Supabase, porque el servidor comprueba el estado de la cuenta en cada petición.

**Cómo se crea:** registra una cuenta normal y cambia su `rol` a `scanner` en Supabase (igual que se hace con un admin). Si la columna `rol` tiene una restricción `CHECK`, añade `scanner` a los valores permitidos.

### 2. Sesión de 30 días para el escáner

**Por qué:** el resto de cuentas caducan a las 8 horas. En una tablet de recepción eso obligaría a volver a iniciar sesión casi cada día. Como la cuenta `scanner` tiene permisos mínimos, es un riesgo aceptable. Si se roba la tablet, se desactiva la cuenta y el token deja de valer.

### 3. Pantalla en modo kiosco

**Qué es:** cuando entra una cuenta `scanner`, la barra de navegación oculta los enlaces a *Panel* y *Mi perfil*, y si intenta abrir cualquier otra página se la redirige a `/scanner.html`. Los administradores siguen viendo la navegación completa.

**Por qué:** que un socio que se acerque a la tablet no pueda navegar a otras pantallas por error. La protección real está en el servidor (el rol); esto solo evita confusión y toques accidentales. Para bloquear también el dispositivo, abre el navegador en pantalla completa (`chrome --kiosk http://IP:5000/scanner.html`) o usa "fijar pantalla" en Android.

### Usarlo desde otro dispositivo

1. Conecta el dispositivo a la misma red y abre `http://IP_DEL_SERVIDOR:5000/login.html`.
2. **La cámara solo funciona en `https://` o `localhost`** (restricción de los navegadores). Con `http://` y una IP, el botón de cámara falla, aunque la introducción manual del código sí funciona. Para producción usa HTTPS (por ejemplo Caddy como proxy inverso); para pruebas, un túnel como `cloudflared tunnel --url http://localhost:5000`.
3. Si hay un proxy delante, deja `trust proxy` activado en `server.js`; si no lo hay, quítalo.

## Puesta en marcha

1. **Instalar dependencias**
   ```bash
   cd backend
   npm install
   ```

2. **Crear `backend/.env`** a partir de la plantilla
   ```bash
   cp .env.example .env
   ```
   ```env
   PORT=5000
   SUPABASE_URL=https://TU_PROYECTO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key   # solo en el servidor, nunca en el frontend
   JWT_SECRET=una_cadena_larga_y_aleatoria_de_32+_caracteres
   ```
   El servidor no arranca si `JWT_SECRET` falta o tiene menos de 32 caracteres.

3. **Preparar la base de datos en Supabase** (SQL Editor, en este orden)

   1. Crea las tablas `users` (`id`, `email`, `password_hash`, `nombre`, `telefono`, `username`, `rol`, `activo`, `qr_code`, `created_at`) y `entries` (`id`, `user_id`, `entrada_timestamp`, `salida_timestamp`). Si `rol` tiene una restricción `CHECK`, debe permitir `user`, `admin` y `scanner`.
   2. Restricciones, índice y RLS:
      ```sql
      alter table users add constraint users_email_key    unique (email);
      alter table users add constraint users_username_key unique (username);
      alter table users add constraint users_qr_code_key  unique (qr_code);
      create unique index entries_one_open_per_user on entries (user_id) where salida_timestamp is null;
      alter table users   enable row level security;
      alter table entries enable row level security;
      ```
   3. Ejecuta [backend/sql/edicion_perfil.sql](backend/sql/edicion_perfil.sql): columnas de dirección y facturación, y la tabla `audit_log` (con RLS).
   4. Ejecuta [backend/sql/baja_usuarios.sql](backend/sql/baja_usuarios.sql): función para eliminar cuentas.

4. **Arrancar**
   ```bash
   npm start          # o: npm run dev
   ```
   Abre `http://localhost:5000` (muestra el login). Para crear un administrador, cambia el campo `rol` a `admin` de un usuario directamente en Supabase.

## Seguridad

- Contraseñas con **bcrypt**; login resistente a inyección de filtros y a enumeración de usuarios por tiempo de respuesta.
- **JWT** de 8 h (30 días para la cuenta `scanner`); el rol y el estado activo se revalidan en la BD en cada petición.
- Rutas de administración y datos de otros socios protegidas en el servidor; el escáner solo admite `admin` o `scanner` (mínimo privilegio).
- `helmet` con CSP estricta (solo scripts propios), sin CORS abierto y cuerpo de las peticiones limitado a 10 kb.
- Límite de intentos en login/registro, en cambios de perfil y contraseña, en acciones destructivas del admin y un límite general de la API.
- Validación de todo lo que entra con `zod` (lista blanca, rechaza campos no previstos) y errores internos que nunca se envían al cliente.
- Auditoría de los cambios de perfil y de las acciones del admin sobre cuentas.
- **RLS activado** en Supabase: el acceso a los datos solo se hace desde el backend con la `service_role` key.
- En producción, servir siempre por **HTTPS** (la cámara del escáner lo exige fuera de localhost).

## Estado y próximos pasos

### ✅ Hecho
- Registro, login, roles (`user` / `admin` / `scanner`) y escáner de recepción con QR, con cuenta dedicada y modo kiosco para la tablet.
- Perfil del socio con edición de todos sus datos, datos de facturación y cambio de contraseña.
- Panel de admin: corrección de datos de contacto y facturación, desactivar/reactivar y eliminar cuentas.
- Auditoría de las acciones del admin y de los cambios de perfil (tabla `audit_log`), con pantalla de consulta, filtros y paginación.
- Seguridad base: validación en servidor, `helmet`, límite de intentos, RLS activado en Supabase, `node_modules` fuera de git.
- Librerías de QR (`qrcodejs` y `html5-qrcode`) servidas desde `frontend/vendor`, sin CDN. La CSP solo permite scripts propios (`'self'`).
- Páginas 403 y 404, y URLs sin `.html` (`/`, `/login`, `/admin`...).

### 🔜 Siguiente

**1. Correo electrónico** (requiere elegir un servicio de envío, por ejemplo Resend, SendGrid o SMTP propio, y guardar su clave en `.env`)
- [ ] Recuperar la contraseña con un enlace por email ("He olvidado mi contraseña"). Hoy un socio que la pierde se queda sin acceso y el admin no puede ayudarle.
- [ ] Verificar por correo los cambios de email (hoy solo se exige la contraseña actual).
- [ ] Al cambiar la contraseña, invalidar las sesiones abiertas (hoy un token anterior sigue valiendo hasta que caduca, 8 h).

**2. Alta de usuarios desde el panel**
- [ ] Que el admin pueda crear un socio (para recepción, sin que tenga que registrarse él).
- [ ] Crear las cuentas `scanner` de las tablets desde el panel, en lugar de cambiar el rol a mano en Supabase.
- [ ] Decidir cómo recibe el socio su acceso: contraseña temporal o enlace de activación por email (depende del punto 1).

**3. Mejoras de la auditoría** (la pantalla básica ya está hecha)
- [ ] Exportar el registro a CSV.
- [ ] Registrar también los inicios de sesión fallidos y los cambios de contraseña por recuperación (cuando exista).
- [ ] Definir cuánto tiempo se conserva (ver RGPD).

### 🧹 Pendiente de limpieza y calidad
- [ ] Quitar las dependencias que ya no se usan (`bcryptjs` y `cors`).
- [ ] Actualizar `nodemon`: `package.json` tiene la versión 1.x, muy antigua; la 3.x es la actual.
- [ ] Ejecutar `npm audit` y revisar el resultado.
- [ ] Servir también las fuentes (Inter y Oswald, hoy desde Google Fonts) desde el propio servidor, para no depender de ningún tercero.
- [ ] Botón para regenerar el QR en el perfil (el endpoint `POST /api/users/me/qr` ya existe).
- [ ] Tests automáticos de la API (permisos por rol, validaciones y rutas de admin).
- [ ] Guía de despliegue: dominio con HTTPS (Caddy), variables de entorno y copias de seguridad de Supabase.

### 📋 Más adelante
**RGPD** (imprescindible antes de abrirlo a socios reales, porque se guardan NIF y direcciones)
- [ ] Política de privacidad y términos de uso.
- [ ] Casilla de aceptación en el registro.
- [ ] Que el socio pueda descargar sus datos.
- [ ] Que el socio pueda eliminar su propia cuenta.
- [ ] Definir cuánto tiempo se conserva el historial de accesos y la auditoría.

**Mejoras de escáner y datos**
- [ ] Evitar el doble escaneo accidental (tiempo mínimo entre lecturas).
- [ ] Cierre automático nocturno de las entradas que se quedaron abiertas (salidas olvidadas).
- [ ] Historial de entradas para el admin por fecha o por socio, con exportación a CSV.
- [ ] Estadísticas de afluencia (horas punta, días con más asistencia).

**Producto**
- [ ] Cuotas y planes (pendiente de definir).
- [ ] PWA instalable y modo kiosco para la tablet.
- [ ] Rol de recepcionista con permisos más limitados que el admin.
