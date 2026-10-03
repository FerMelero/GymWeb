const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const saltRounds = 10;

// ---------------------- REGISTER ----------------------
const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(60),
  telefono: z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/).optional().or(z.literal('')),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,20}$/),
  email: z.string().trim().toLowerCase().email().max(254),
  contraseña: z.string().min(8).max(72), // bcrypt ignora a partir del byte 72
});

exports.register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Datos de registro no válidos' });
    }
    const { email, contraseña, nombre, telefono, username } = parsed.data;

    const password_hash = await bcrypt.hash(contraseña, saltRounds);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        nombre,
        username,
        telefono: telefono || null,
        rol: 'user',
        qr_code: crypto.randomUUID(),
      })
      .select('id, nombre, username, rol')
      .single();

    if (error) {
      // 23505 = violación de UNIQUE (email o username repetido)
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'El email o el usuario ya están registrados' });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: data
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ---------------------- LOGIN ----------------------
// regex para excluir ciertas cosas
const EMAIL_RE = /^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/;
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
// Hash falso para que "usuario no existe" tarde lo mismo que "contraseña incorrecta"
const DUMMY_HASH = bcrypt.hashSync('dummy-password-no-real', saltRounds);

// mejor filtramos lo que realmente necesitamos
const publicUser = (u) => ({ id: u.id, nombre: u.nombre, username: u.username, rol: u.rol });

exports.login = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const column = EMAIL_RE.test(identifier) ? 'email'
                 : USERNAME_RE.test(identifier) ? 'username'
                 : null;

                 // longitud máxima de 72 para no sobrecargar
    if (!column || !password || password.length > 72) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    // .eq() escapa el valor: no hay inyección de filtros
    const { data: user } = await supabase
      .from('users')
      .select('id, nombre, username, rol, activo, password_hash')
      .eq(column, identifier)
      .maybeSingle();

    // se calcula un hash falso una vez, para que el tiempo de respuesta o delate
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
      { algorithm: 'HS256', expiresIn: user.rol === 'scanner' ? '30d' : '8h' }
    );

    res.json({ success: true, token, user: publicUser(user) });
  // error por consola, ya no devuelve info de supabase
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

