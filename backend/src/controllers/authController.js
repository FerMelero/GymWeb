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
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Buscar por email o username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .single();

    if (error || !user) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Comparar contraseña
    const coincide = await bcrypt.compare(password, user.password_hash);

    if (!coincide) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Crear token
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
