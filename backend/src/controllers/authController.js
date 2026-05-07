const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Login: verifica credenciales y retorna JWT con org_id
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    // Buscar usuario por email
    const { rows } = await pool.query(
      `SELECT u.*, o.name as org_name 
       FROM users u 
       JOIN organizations o ON u.org_id = o.id 
       WHERE u.email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar JWT con org_id en los claims (clave para multi-tenancy)
    const token = jwt.sign(
      {
        userId: user.id,
        orgId: user.org_id,
        email: user.email,
        name: user.name,
        orgName: user.org_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: user.org_id,
        orgName: user.org_name,
        avatarUrl: user.avatar_url,
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener datos del usuario autenticado
const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.org_id, o.name as org_name
       FROM users u
       JOIN organizations o ON u.org_id = o.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getMe:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login, getMe };