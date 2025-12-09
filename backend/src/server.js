const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes')

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());


// Rutas de test
app.use('/api/auth', authRoutes);

// Middlewares
app.use(express.json());
app.use(cors());


// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: '🏋️ API del Gimnasio',
    version: '1.0.0',
    status: 'OK'
  });
});



// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}
    `);
    console.log("Servidor arrancando con archivo:", __filename);

});