
const jwt = require('jsonwebtoken');

const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization || '';

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res
            .status(401)
            .json({ success: false, message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        );

        const { data: user } = await supabase
            .from('users')
            .select('id, rol, activo')
            .eq('id', decoded.id)
            .maybeSingle();

        if (!user || !user.activo) {
            return res
                .status(401)
                .json({ success: false, message: 'Token inválido o expirado' });
        }

        req.userId = user.id;
        req.userRol = user.rol; // rol de la BD, no el del token

        next();
    } catch {
        return res
            .status(401)
            .json({ success: false, message: 'Token inválido o expirado' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userRol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: se requiere rol admin'
        });
    }

    next();
};

module.exports = { authMiddleware, adminMiddleware };

