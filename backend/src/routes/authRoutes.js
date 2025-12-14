const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {authMiddleware} = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Acceso permitido a ruta protegida',
    userId: req.userId,
    userRol: req.userRol
  });
});

module.exports = router;
