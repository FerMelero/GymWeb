const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

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
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
    });
        
    }
}