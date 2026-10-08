const supabase = require('../config/supabase');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { validNifCif } = require('../utils/validators');

const saltRounds = 10;
const PROFILE_COLUMNS =
  'id, email, nombre, telefono, username, rol, activo, created_at, qr_code, direccion, nombre_fiscal, nif_cif, direccion_cobro';

const BILLING_FIELDS = ['nombre_fiscal', 'nif_cif', 'direccion_cobro'];
const FIELD_LABELS = {
  nombre: 'nombre',
  telefono: 'teléfono',
  email: 'email',
  username: 'usuario',
  direccion: 'dirección',
  nombre_fiscal: 'nombre fiscal',
  nif_cif: 'NIF/CIF',
  direccion_cobro: 'dirección de cobro',
};

// ---------------------- Esquemas de validación ----------------------
// Los campos opcionales vacíos se guardan como null.
const optionalText = (label, max) =>
  z.string({ error: `${label} no es válido` }).trim().max(max, `${label}: máximo ${max} caracteres`)
    .transform((v) => v || null);

const fields = {
  nombre: z.string({ error: 'El nombre no es válido' }).trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres').max(60, 'El nombre es demasiado largo (máx. 60)'),
  telefono: z.string({ error: 'El teléfono no es válido' }).trim().max(20, 'El teléfono es demasiado largo')
    .refine((v) => v === '' || /^[+\d][\d\s-]{6,19}$/.test(v), 'El teléfono no es válido')
    .transform((v) => v || null),
  email: z.string({ error: 'El email no es válido' }).trim().toLowerCase()
    .max(254, 'El email es demasiado largo').email('Introduce un email válido'),
  username: z.string({ error: 'El usuario no es válido' }).trim().toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/, 'Usuario de 3-20 caracteres (letras, números, _ o .)'),
  direccion: optionalText('La dirección', 200),
  nombre_fiscal: optionalText('El nombre fiscal', 120),
  nif_cif: z.string({ error: 'El NIF/CIF no es válido' }).trim().max(15, 'El NIF/CIF no es válido')
    .transform((v) => v.toUpperCase().replace(/[\s-]/g, ''))
    .refine((v) => v === '' || validNifCif(v), 'El NIF/CIF no es válido (revisa los dígitos y la letra de control)')
    .transform((v) => v || null),
  direccion_cobro: optionalText('La dirección de cobro', 200),
};

const passwordField = (label) =>
  z.string({ error: `${label} no es válida` }).max(72, 'Máximo 72 caracteres');

// Un usuario puede cambiar toda su información. strictObject rechaza cualquier campo
// desconocido (rol, activo, id...), así que no se puede escalar privilegios.
const selfSchema = z.strictObject({
  ...fields,
  contraseñaActual: passwordField('La contraseña'),
}).partial();

// El admin solo puede corregir contacto y facturación (nada de rol, activo, usuario o contraseña).
const adminSchema = z.strictObject({
  nombre: fields.nombre,
  telefono: fields.telefono,
  email: fields.email,
  direccion: fields.direccion,
  nombre_fiscal: fields.nombre_fiscal,
  nif_cif: fields.nif_cif,
  direccion_cobro: fields.direccion_cobro,
  solicitadoPorCliente: z.boolean(),
}).partial();

const statusSchema = z.strictObject({
  activo: z.boolean({ error: 'Estado no válido' }),
});

const deleteSchema = z.strictObject({
  confirmar: z.string({ error: 'Escribe el nombre de usuario para confirmar' }).max(64),
});

const passwordSchema = z.strictObject({
  contraseñaActual: passwordField('La contraseña').min(1, 'Introduce tu contraseña actual'),
  contraseñaNueva: passwordField('La contraseña').min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

// ---------------------- Utilidades ----------------------
function zodErrors(error) {
  const errors = {};
  let message = 'Revisa los campos marcados';
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      message = 'La petición incluye campos que no se pueden modificar';
      continue;
    }
    const key = issue.path[0];
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { errors, message };
}

const fail = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });

// Registro de auditoría: guarda quién cambió qué campos (no los valores). No bloquea la operación.
async function audit(actorId, targetId, action, changedFields) {
  try {
    const { error } = await supabase.from('audit_log').insert({
      actor_id: String(actorId),
      target_id: String(targetId),
      action,
      fields: changedFields,
    });
    if (error) console.error('No se pudo guardar el registro de auditoría:', error.message);
  } catch (err) {
    console.error('No se pudo guardar el registro de auditoría:', err);
  }
}

// Convierte un error UNIQUE de la BD en un error de campo (email o usuario repetido)
function duplicateField(error) {
  const text = `${error.message || ''} ${error.details || ''}`;
  if (/username/i.test(text)) return { username: 'Ese nombre de usuario ya está en uso' };
  return { email: 'Ese email ya está registrado' };
}

// Aplica solo los campos que realmente cambian y responde con el resultado
async function saveChanges(res, { actorId, targetId, current, patch, action }) {
  const changes = {};
  for (const [key, value] of Object.entries(patch)) {
    if ((current[key] ?? null) !== value) changes[key] = value;
  }
  const changed = Object.keys(changes);

  if (!changed.length) {
    return res.json({ success: true, changed: [], message: 'No había cambios que guardar', user: current });
  }

  const { data, error } = await supabase
    .from('users')
    .update(changes)
    .eq('id', targetId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      return fail(res, 409, 'Hay datos que ya están en uso', duplicateField(error));
    }
    throw error;
  }

  await audit(actorId, targetId, action, changed);

  return res.json({
    success: true,
    changed,
    message: `Cambios guardados: ${changed.map((k) => FIELD_LABELS[k]).join(', ')}`,
    user: data,
  });
}


exports.regenerateQr = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ qr_code: crypto.randomUUID() })
      .eq('id', req.userId)
      .select('qr_code')
      .single();

    if (error) throw error;

    res.json({ success: true, qr_code: data.qr_code });

  } catch (error) {
    console.error('Error en regenerateQr:', error);
    res.status(500).json({ success: false, message: 'Error al regenerar el QR' });
  }
};

exports.getAllUsers = async(req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, telefono, username, rol, activo, created_at, qr_code')
      .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        count: data.length,
        users: data
    });
    
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
    });
  }
}

exports.getMyProfile = async(req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(PROFILE_COLUMNS)
            .eq('id',req.userId)
            .single();
        
        if (error) throw error;
        res.json({
            success: true,
            user: data
        });

            
        
    } catch (error) {
        console.error('Error en getMyProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
    });
        
    }
}

// ---------------------- Admin: ver un usuario ----------------------
exports.getUserById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(PROFILE_COLUMNS)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail(res, 404, 'Usuario no encontrado');

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Error en getUserById:', error);
    fail(res, 500, 'Error al obtener el usuario');
  }
};

// ---------------------- Usuario: editar su perfil ----------------------
exports.updateMyProfile = async (req, res) => {
  try {
    if (req.userRol === 'scanner') return fail(res, 403, 'Esta cuenta no puede editar su perfil');

    const parsed = selfSchema.safeParse(req.body);
    if (!parsed.success) {
      const { errors, message } = zodErrors(parsed.error);
      return fail(res, 400, message, errors);
    }
    const { contraseñaActual, ...patch } = parsed.data;

    const { data: current, error: findError } = await supabase
      .from('users')
      .select(`${PROFILE_COLUMNS}, password_hash`)
      .eq('id', req.userId)
      .maybeSingle();
    if (findError) throw findError;
    if (!current) return fail(res, 404, 'Usuario no encontrado');

    // Email y usuario son los datos con los que se inicia sesión: exigen la contraseña actual
    const touchesLogin = ['email', 'username'].some((k) => k in patch && patch[k] !== current[k]);
    if (touchesLogin) {
      if (!contraseñaActual) {
        return fail(res, 400, 'Falta la contraseña actual', {
          contraseñaActual: 'Introduce tu contraseña actual para cambiar el email o el usuario',
        });
      }
      const ok = await bcrypt.compare(contraseñaActual, current.password_hash);
      if (!ok) {
        return fail(res, 400, 'La contraseña actual no es correcta', {
          contraseñaActual: 'La contraseña actual no es correcta',
        });
      }
    }

    const { password_hash, ...currentPublic } = current;
    return await saveChanges(res, {
      actorId: req.userId,
      targetId: req.userId,
      current: currentPublic,
      patch,
      action: 'self_update',
    });
  } catch (error) {
    console.error('Error en updateMyProfile:', error);
    fail(res, 500, 'No se pudieron guardar los cambios. Inténtalo de nuevo.');
  }
};

// ---------------------- Usuario: cambiar contraseña ----------------------
exports.changeMyPassword = async (req, res) => {
  try {
    if (req.userRol === 'scanner') return fail(res, 403, 'Esta cuenta no puede cambiar su contraseña');

    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
      const { errors, message } = zodErrors(parsed.error);
      return fail(res, 400, message, errors);
    }
    const { contraseñaActual, contraseñaNueva } = parsed.data;

    if (contraseñaActual === contraseñaNueva) {
      return fail(res, 400, 'La nueva contraseña debe ser distinta', {
        contraseñaNueva: 'La nueva contraseña debe ser distinta de la actual',
      });
    }

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.userId)
      .maybeSingle();
    if (findError) throw findError;
    if (!user) return fail(res, 404, 'Usuario no encontrado');

    const ok = await bcrypt.compare(contraseñaActual, user.password_hash);
    if (!ok) {
      return fail(res, 400, 'La contraseña actual no es correcta', {
        contraseñaActual: 'La contraseña actual no es correcta',
      });
    }

    const password_hash = await bcrypt.hash(contraseñaNueva, saltRounds);
    const { error } = await supabase.from('users').update({ password_hash }).eq('id', req.userId);
    if (error) throw error;

    await audit(req.userId, req.userId, 'password_change', ['password']);
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en changeMyPassword:', error);
    fail(res, 500, 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
  }
};

// ---------------------- Admin: corregir datos de un usuario ----------------------
exports.updateUserByAdmin = async (req, res) => {
  try {
    const parsed = adminSchema.safeParse(req.body);
    if (!parsed.success) {
      const { errors, message } = zodErrors(parsed.error);
      return fail(res, 400, message, errors);
    }
    const { solicitadoPorCliente, ...patch } = parsed.data;

    const { data: current, error: findError } = await supabase
      .from('users')
      .select(PROFILE_COLUMNS)
      .eq('id', req.params.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!current) return fail(res, 404, 'Usuario no encontrado');

    // Los datos de facturación solo se tocan bajo petición del cliente
    const billingChanged = BILLING_FIELDS.some((k) => k in patch && (current[k] ?? null) !== patch[k]);
    if (billingChanged && solicitadoPorCliente !== true) {
      return fail(res, 400, 'Confirma que el cliente ha solicitado el cambio', {
        solicitadoPorCliente: 'Confirma que el cliente ha solicitado cambiar sus datos de facturación',
      });
    }

    return await saveChanges(res, {
      actorId: req.userId,
      targetId: current.id,
      current,
      patch,
      action: billingChanged ? 'admin_update_billing' : 'admin_update',
    });
  } catch (error) {
    console.error('Error en updateUserByAdmin:', error);
    fail(res, 500, 'No se pudieron guardar los cambios. Inténtalo de nuevo.');
  }
};

// ---------------------- Admin: activar / desactivar una cuenta ----------------------
exports.setUserStatus = async (req, res) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      const { errors, message } = zodErrors(parsed.error);
      return fail(res, 400, message, errors);
    }
    const { activo } = parsed.data;

    if (String(req.params.id) === String(req.userId)) {
      return fail(res, 400, 'No puedes cambiar el estado de tu propia cuenta');
    }

    const { data: target, error: findError } = await supabase
      .from('users')
      .select(PROFILE_COLUMNS)
      .eq('id', req.params.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!target) return fail(res, 404, 'Usuario no encontrado');

    // Las cuentas de admin se gestionan a mano en Supabase: evita bloqueos entre admins
    if (target.rol === 'admin') {
      return fail(res, 403, 'Las cuentas de administrador no se pueden modificar desde el panel');
    }

    if (Boolean(target.activo) === activo) {
      return res.json({
        success: true,
        changed: false,
        message: `La cuenta ya estaba ${activo ? 'activa' : 'desactivada'}`,
        user: target,
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ activo })
      .eq('id', target.id)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw error;

    // Si se desactiva a alguien que está dentro, se cierra su entrada: ya no podría fichar la salida
    let closed = 0;
    if (!activo) {
      const { data: open, error: closeError } = await supabase
        .from('entries')
        .update({ salida_timestamp: new Date().toISOString() })
        .eq('user_id', target.id)
        .is('salida_timestamp', null)
        .select('id');
      if (closeError) console.error('No se pudieron cerrar las entradas abiertas:', closeError);
      else closed = open.length;
    }

    await audit(
      req.userId,
      target.id,
      activo ? 'admin_activate_user' : 'admin_deactivate_user',
      { activo, ...(closed ? { entradas_cerradas: closed } : {}) }
    );

    res.json({
      success: true,
      changed: true,
      message: activo
        ? `Cuenta de @${user.username} reactivada`
        : `Cuenta de @${user.username} desactivada${closed ? ' y su entrada abierta se ha cerrado' : ''}`,
      user,
    });
  } catch (error) {
    console.error('Error en setUserStatus:', error);
    fail(res, 500, 'No se pudo cambiar el estado. Inténtalo de nuevo.');
  }
};

// ---------------------- Admin: eliminar una cuenta ----------------------
exports.deleteUser = async (req, res) => {
  try {
    const parsed = deleteSchema.safeParse(req.body);
    if (!parsed.success) {
      const { errors, message } = zodErrors(parsed.error);
      return fail(res, 400, message, errors);
    }

    if (String(req.params.id) === String(req.userId)) {
      return fail(res, 400, 'No puedes eliminar tu propia cuenta');
    }

    const { data: target, error: findError } = await supabase
      .from('users')
      .select('id, rol, username')
      .eq('id', req.params.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!target) return fail(res, 404, 'Usuario no encontrado');

    if (target.rol === 'admin') {
      return fail(res, 403, 'Las cuentas de administrador no se pueden eliminar desde el panel');
    }

    // Confirmación explícita: hay que escribir el usuario exacto
    const typed = parsed.data.confirmar.trim().replace(/^@/, '').toLowerCase();
    if (typed !== String(target.username).toLowerCase()) {
      return fail(res, 400, 'El nombre de usuario no coincide', {
        confirmar: 'No coincide con el nombre de usuario de la cuenta',
      });
    }

    // Borrado + historial + auditoría en una sola transacción (ver sql/baja_usuarios.sql).
    // En la auditoría solo queda el usuario y el rol, no más datos personales.
    const { data: removed, error } = await supabase.rpc('delete_user_cascade', {
      uid: String(target.id),
      actor: String(req.userId),
      snapshot: { username: target.username, rol: target.rol },
    });
    if (error) throw error;
    if (!removed) return fail(res, 404, 'Usuario no encontrado');

    res.json({ success: true, message: `Cuenta de @${target.username} eliminada junto con su historial` });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    fail(res, 500, 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
  }
};
