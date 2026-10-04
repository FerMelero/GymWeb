const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');


router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers)
router.get('/me', authMiddleware, userController.getMyProfile)
router.patch('/me', authMiddleware, userController.updateMyProfile)
router.patch('/me/password', authMiddleware, userController.changeMyPassword)
router.post('/me/qr', authMiddleware, userController.regenerateQr)

// Rutas con :id siempre después de /me (si no, "me" se leería como un id)
const validId = (req, res, next) =>
  /^[A-Za-z0-9-]{1,64}$/.test(req.params.id)
    ? next()
    : res.status(400).json({ success: false, message: 'Identificador no válido' })

router.get('/:id', authMiddleware, adminMiddleware, validId, userController.getUserById)
router.patch('/:id', authMiddleware, adminMiddleware, validId, userController.updateUserByAdmin)

module.exports = router
