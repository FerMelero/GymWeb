const supabase = require('../config/supabase');
const { z } = require('zod');

// Acciones que se registran en audit_log (ver userController)
const ACTIONS = [
  'self_update',
  'password_change',
  'admin_update',
  'admin_update_billing',
  'admin_activate_user',
  'admin_deactivate_user',
  'admin_delete_user',
];

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida');

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.enum(ACTIONS).optional(),
  usuario: z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{1,20}$/, 'Usuario no válido').optional(),
  desde: date.optional(),
  hasta: date.optional(),
});

// Los ids se guardan como texto; solo se aceptan caracteres seguros antes de usarlos en un filtro
const SAFE_ID = /^[A-Za-z0-9-]{1,64}$/;

const startOfDay = (d) => new Date(`${d}T00:00:00`);

exports.listAudit = async (req, res) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = {};
      parsed.error.issues.forEach((i) => { if (i.path[0] && !errors[i.path[0]]) errors[i.path[0]] = 'Valor no válido'; });
      return res.status(400).json({ success: false, message: 'Filtros no válidos', errors });
    }
    const { page, limit, action, usuario, desde, hasta } = parsed.data;

    let query = supabase
      .from('audit_log')
      .select('id, actor_id, target_id, action, fields, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (action) query = query.eq('action', action);
    if (desde) query = query.gte('created_at', startOfDay(desde).toISOString());
    if (hasta) {
      const end = startOfDay(hasta);
      end.setDate(end.getDate() + 1); // "hasta" incluye el día completo
      query = query.lt('created_at', end.toISOString());
    }

    // Filtrar por usuario: acciones que hizo o que recibió una cuenta cuyo username contiene el texto
    if (usuario) {
      const { data: matches, error: matchError } = await supabase
        .from('users')
        .select('id')
        .ilike('username', `%${usuario}%`)
        .limit(200);
      if (matchError) throw matchError;

      const ids = (matches || []).map((u) => String(u.id)).filter((id) => SAFE_ID.test(id));
      if (!ids.length) {
        return res.json({ success: true, page, limit, total: 0, pages: 0, entries: [] });
      }
      const list = ids.join(',');
      query = query.or(`actor_id.in.(${list}),target_id.in.(${list})`);
    }

    const from = (page - 1) * limit;
    const { data: rows, error, count } = await query.range(from, from + limit - 1);
    if (error) throw error;

    // Resolver nombres de quien actuó y de quien recibió la acción
    const ids = [...new Set((rows || []).flatMap((r) => [r.actor_id, r.target_id]).filter((id) => SAFE_ID.test(String(id))))];
    const people = new Map();
    if (ids.length) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nombre, username, rol')
        .in('id', ids);
      if (usersError) throw usersError;
      (users || []).forEach((u) => people.set(String(u.id), { id: u.id, nombre: u.nombre, username: u.username, rol: u.rol }));
    }

    const entries = (rows || []).map((r) => ({
      id: r.id,
      action: r.action,
      created_at: r.created_at,
      fields: r.fields,
      actor: people.get(String(r.actor_id)) || null,
      target: people.get(String(r.target_id)) || null,
    }));

    const total = count ?? entries.length;
    res.json({ success: true, page, limit, total, pages: Math.ceil(total / limit), entries });
  } catch (error) {
    console.error('Error en listAudit:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la auditoría' });
  }
};
