const { pool } = require('../config/database');

const getMessages = async (req, res) => {
  const { orgId } = req.user;
  const { conversationId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 AND org_id = $2
       ORDER BY created_at ASC`,
      [conversationId, orgId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo mensajes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getMessages };