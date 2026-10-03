const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { authMiddleware, adminMiddleware, scannerMiddleware } = require('../middleware/auth');

// Registrar entrada/salida (admin o cuenta 'scanner' de la tablet de recepción)
router.post('/', authMiddleware, scannerMiddleware, entryController.registerEntry);

// Ver mi historial o todas las entradas (según rol)
router.get('/', authMiddleware, entryController.getEntries);

// Ver entradas de hoy (solo admin)
router.get('/today', authMiddleware, adminMiddleware, entryController.getTodayEntries);

// Ver quién está dentro ahora (solo admin)
router.get('/inside', authMiddleware, adminMiddleware, entryController.getCurrentlyInside);

module.exports = router;