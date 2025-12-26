const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const entryRoutes = require('./routes/entryRoutes');

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: '🏋️ API del Gimnasio',
    version: '1.0.0',
    status: 'OK'
  });
});

// Usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/entries', entryRoutes);
app.use(express.static(path.join(__dirname, '../../frontend')));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});