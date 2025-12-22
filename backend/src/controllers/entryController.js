const supabase = require('../config/supabase');

// Función para calcular duración entre dos fechas
function calcularDuracion(entrada, salida) {
  const diff = new Date(salida) - new Date(entrada);
  const horas = Math.floor(diff / 1000 / 60 / 60);
  const minutos = Math.floor((diff / 1000 / 60) % 60);
  return `${horas}h ${minutos}min`;
}

// ========== REGISTRAR ENTRADA O SALIDA ==========
exports.registerEntry = async (req, res) => {
  try {
    const { qr_code } = req.body;

    // 1. Validar que llegue el qr_code
    if (!qr_code) {
      return res.status(400).json({
        success: false,
        message: 'El código QR es obligatorio'
      });
    }

    // 2. Buscar el usuario por su qr_code
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('qr_code', qr_code)
      .single();

    // Si no existe el usuario
    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Código QR inválido'
      });
    }

    // 3. Verificar que el usuario esté activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta con recepción'
      });
    }

    // 4. Buscar si tiene una entrada abierta (sin salida)
    const { data: entradaAbierta, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .is('salida_timestamp', null)
      .order('entrada_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle(); // maybeSingle permite que no haya resultados

    // 5. CASO A: No tiene entrada abierta → REGISTRAR ENTRADA
    if (!entradaAbierta) {
      const { data: nuevaEntrada, error: insertError } = await supabase
        .from('entries')
        .insert({ 
          user_id: user.id,
          entrada_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(201).json({
        success: true,
        action: 'entrada',
        message: `¡Bienvenido ${user.nombre}!`,
        user: {
          nombre: user.nombre,
          email: user.email
        },
        timestamp: nuevaEntrada.entrada_timestamp
      });
    }

    // 6. CASO B: Sí tiene entrada abierta → REGISTRAR SALIDA
    const salidaTimestamp = new Date().toISOString();
    
    const { data: entradaActualizada, error: updateError } = await supabase
      .from('entries')
      .update({ salida_timestamp: salidaTimestamp })
      .eq('id', entradaAbierta.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const duracion = calcularDuracion(
      entradaAbierta.entrada_timestamp, 
      salidaTimestamp
    );

    return res.json({
      success: true,
      action: 'salida',
      message: `¡Hasta luego ${user.nombre}!`,
      user: {
        nombre: user.nombre,
        email: user.email
      },
      entrada: entradaAbierta.entrada_timestamp,
      salida: salidaTimestamp,
      duracion: duracion
    });

  } catch (error) {
    console.error('Error en registerEntry:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar entrada/salida',
      error: error.message
    });
  }
};

// ========== VER HISTORIAL DE ENTRADAS ==========
exports.getEntries = async (req, res) => {
  try {
    let query = supabase
      .from('entries')
      .select(`
        *,
        users (id, nombre, email, username)
      `)
      .order('entrada_timestamp', { ascending: false });

    // Si NO es admin, solo ver sus propias entradas
    if (req.userRol !== 'admin') {
      query = query.eq('user_id', req.userId);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      count: entries.length,
      entries: entries
    });

  } catch (error) {
    console.error('Error en getEntries:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener entradas',
      error: error.message
    });
  }
};

// ========== VER ENTRADAS DE HOY (SOLO ADMIN) ==========
exports.getTodayEntries = async (req, res) => {
  try {
    // Obtener fecha de hoy a las 00:00
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data: entries, error } = await supabase
      .from('entries')
      .select(`
        *,
        users (id, nombre, email, username)
      `)
      .gte('entrada_timestamp', hoy.toISOString())
      .order('entrada_timestamp', { ascending: false });

    if (error) throw error;

    // Separar quién está dentro y quién ya salió
    const dentroDelGym = entries.filter(e => !e.salida_timestamp);
    const yaSalieron = entries.filter(e => e.salida_timestamp);

    return res.json({
      success: true,
      fecha: hoy.toISOString().split('T')[0],
      total_entradas: entries.length,
      dentro_ahora: dentroDelGym.length,
      ya_salieron: yaSalieron.length,
      entradas: entries
    });

  } catch (error) {
    console.error('Error en getTodayEntries:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener entradas de hoy',
      error: error.message
    });
  }
};

// ========== VER QUIÉN ESTÁ DENTRO EN X MOMENTO ==========
exports.getCurrentlyInside = async (req, res) => {
  try {
    const { data: entries, error } = await supabase
      .from('entries')
      .select(`
        *,
        users (id, nombre, email, username)
      `)
      .is('salida_timestamp', null)
      .order('entrada_timestamp', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      count: entries.length,
      usuarios_dentro: entries
    });

  } catch (error) {
    console.error('Error en getCurrentlyInside:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios dentro',
      error: error.message
    });
  }
};