const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ Error: JWT_SECRET no está definido o tiene menos de 32 caracteres');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.set('trust proxy', 1); // detrás de nginx/Caddy; necesario para limitar por IP real

// Cabeceras de seguridad.
// TODO: al servir qrcode/html5-qrcode en local (paso 7), quitar los CDN de scriptSrc.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null, // solo con HTTPS real; en http rompería los assets
    },
  },
}));

// Sin CORS: el frontend se sirve desde este mismo origen
app.use(express.json({ limit: '10kb' }));

// Límites de peticiones
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, espera unos minutos' },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones, espera un momento' },
});

// Cambios de perfil y contraseña (piden la contraseña actual): evita fuerza bruta sobre ella
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, espera unos minutos' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.patch('/api/users/me', profileLimiter);
app.patch('/api/users/me/password', profileLimiter);
app.use('/api', apiLimiter);

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const entryRoutes = require('./routes/entryRoutes');

// Página de inicio: el login (si ya hay sesión, login.js redirige a la página de su rol)
const frontendDir = path.join(__dirname, '../../frontend');
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'login.html'));
});

// Usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/entries', entryRoutes);

// 403 con su código HTTP real (la página estática por sí sola respondería 200)
app.get(['/403', '/403.html'], (req, res) => res.status(403).sendFile(path.join(frontendDir, '403.html')));

// extensions: permite /login, /admin, /scanner... sin escribir .html
app.use(express.static(frontendDir, { extensions: ['html'] }));

// 404: JSON para la API y página para el navegador
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));
app.use((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
  }
  res.status(404).sendFile(path.join(frontendDir, '404.html'));
});

// Manejador de errores genérico (JSON mal formado, etc.)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ success: false, message: 'Petición no válida' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
