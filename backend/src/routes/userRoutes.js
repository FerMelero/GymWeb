const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');


router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers)
router.get('/me', authMiddleware, userController.getMyProfile)
router.post('/me/qr', authMiddleware, userController.regenerateQr)

module.exports = router
