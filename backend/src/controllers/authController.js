const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const saltRounds = 10;

// ---------------------- REGISTER ----------------------
exports.register = async (req, res) => {
  try {
    const { email, contraseña, nombre, telefono, username } = req.body;

    // Verificar username
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está registrado'
      });
    }

    // Verificar email
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const password_hash = await bcrypt.hash(contraseña, saltRounds);
    const qr_code = crypto.randomUUID();
    const rol = "user";

    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash, nombre, telefono, username, rol, qr_code })
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: data
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------- LOGIN ----------------------
const EMAIL_RE = /^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/;
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
// Hash falso para que "usuario no existe" tarde lo mismo que "contraseña incorrecta"
const DUMMY_HASH = bcrypt.hashSync('dummy-password-no-real', saltRounds);

const publicUser = (u) => ({ id: u.id, nombre: u.nombre, username: u.username, rol: u.rol });

exports.login = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const column = EMAIL_RE.test(identifier) ? 'email'
                 : USERNAME_RE.test(identifier) ? 'username'
                 : null;

    if (!column || !password || password.length > 72) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    // .eq() escapa el valor: no hay inyección de filtros
    const { data: user } = await supabase
      .from('users')
      .select('id, nombre, username, rol, activo, password_hash')
      .eq(column, identifier)
      .maybeSingle();

    // bcrypt se ejecuta SIEMPRE (tiempo constante)
    const coincide = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);

    if (!user || !coincide) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(403).json({ success: false, message: 'Cuenta desactivada. Contacta con recepción' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '8h' }
    );

    res.json({ success: true, token, user: publicUser(user) });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

