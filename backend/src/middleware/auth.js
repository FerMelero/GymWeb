const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return res.status(401).send({ ok: false, message: 'Token no proporcionado' });

    try {
        const tokenLimpio = token.replace('Bearer ', ''); 
        const decoded = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRol = decoded.rol;
        next();

    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido o expirado' 
    });
        
    }
};

module.exports = { authMiddleware };