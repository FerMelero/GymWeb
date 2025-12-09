const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Probar conexión con Supabase
router.get('/connection', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      message: '✅ Conexión con Supabase exitosa',
      database: 'Conectado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Error al conectar con Supabase',
      error: error.message
    });
  }
});

module.exports = router;