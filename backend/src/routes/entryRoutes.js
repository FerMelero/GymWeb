const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Registrar entrada/salida (sin autenticación para que el scanner funcione fácil)
router.post('/', entryController.registerEntry);

// Ver mi historial o todas las entradas (según rol)
router.get('/', authMiddleware, entryController.getEntries);

// Ver entradas de hoy (solo admin)
router.get('/today', authMiddleware, adminMiddleware, entryController.getTodayEntries);

// Ver quién está dentro ahora (solo admin)
router.get('/inside', authMiddleware, adminMiddleware, entryController.getCurrentlyInside);

module.exports = router;