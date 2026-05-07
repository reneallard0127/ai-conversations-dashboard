const { pool } = require('../config/database');
const { broadcastToOrg } = require('../services/websocket');

// Obtener conversaciones paginadas y filtradas (solo de la org del usuario)
const getConversations = async (req, res) => {
  const { orgId } = req.user;
  const {
    page = 1,
    limit = 10,
    status,
    minRating,
    channel,
    dateFrom,
    dateTo,
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = ['c.org_id = $1'];
  const params = [orgId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`c.status = $${paramIndex++}`);
    params.push(status);
  }
  if (minRating) {
    conditions.push(`c.rating >= $${paramIndex++}`);
    params.push(parseFloat(minRating));
  }
  if (channel) {
    conditions.push(`c.channel = $${paramIndex++}`);
    params.push(channel);
  }
  if (dateFrom) {
    conditions.push(`c.started_at >= $${paramIndex++}`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`c.started_at <= $${paramIndex++}`);
    params.push(dateTo);
  }

  const whereClause = conditions.join(' AND ');

  try {
    // Total para paginación
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM conversations c WHERE ${whereClause}`,
      params
    );

    // Conversaciones de la página actual
    const { rows } = await pool.query(
      `SELECT c.*, 
              COUNT(m.id) as message_count
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY c.started_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      }
    });
  } catch (err) {
    console.error('Error obteniendo conversaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nueva conversación
const createConversation = async (req, res) => {
  const { orgId, userId } = req.user;
  const { channel = 'Web' } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO conversations (org_id, user_id, channel, status)
       VALUES ($1, $2, $3, 'open')
       RETURNING *`,
      [orgId, userId, channel]
    );

    const newConversation = rows[0];

    // Notificar a todos los usuarios de la misma org via WebSocket
    broadcastToOrg(orgId, {
      type: 'NEW_CONVERSATION',
      data: newConversation,
    });

    res.status(201).json(newConversation);
  } catch (err) {
    console.error('Error creando conversación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener detalle de una conversación con sus mensajes
const getConversation = async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;

  try {
    // Verificar que la conversación pertenece a la org (multi-tenancy)
    const convResult = await pool.query(
      `SELECT * FROM conversations WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Obtener mensajes ordenados por fecha
    const messagesResult = await pool.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 AND org_id = $2
       ORDER BY created_at ASC`,
      [id, orgId]
    );

    res.json({
      conversation: convResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (err) {
    console.error('Error obteniendo conversación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Calificar conversación (rating 1-5)
const rateConversation = async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating debe ser entre 1 y 5' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE conversations 
       SET rating = $1, status = 'closed', ended_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [rating, id, orgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error calificando conversación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  rateConversation,
};