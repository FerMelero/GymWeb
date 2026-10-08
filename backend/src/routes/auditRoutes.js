const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Solo los administradores pueden consultar el registro de auditoría
router.get('/', authMiddleware, adminMiddleware, auditController.listAudit);

module.exports = router;
