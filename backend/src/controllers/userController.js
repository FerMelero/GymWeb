const supabase = require('../config/supabase');
const crypto = require('crypto');

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
            .select('id, email, nombre, telefono, username, rol, activo, created_at, qr_code')
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