const express = require('express');
const router = express.Router();
const { legal, pendingKeys } = require('../config/legal');

// Público: los documentos legales los ve cualquiera, incluso antes de registrarse
router.get('/', (req, res) => {
  res.json({ success: true, legal, pendientes: pendingKeys().length });
});

module.exports = router;
