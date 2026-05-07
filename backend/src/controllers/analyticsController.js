const { pool } = require('../config/database');

// KPIs para la vista de Resumen
const getSummary = async (req, res) => {
  const { orgId } = req.user;

  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
    const startOfWeek = new Date(today.setDate(today.getDate() - 7)).toISOString();
    const startOfMonth = new Date(today.setDate(today.getDate() - 30)).toISOString();

    // Total conversaciones por período
    const [todayCount, weekCount, monthCount] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM conversations WHERE org_id=$1 AND started_at >= $2`, [orgId, startOfDay]),
      pool.query(`SELECT COUNT(*) FROM conversations WHERE org_id=$1 AND started_at >= $2`, [orgId, startOfWeek]),
      pool.query(`SELECT COUNT(*) FROM conversations WHERE org_id=$1 AND started_at >= $2`, [orgId, startOfMonth]),
    ]);

    // % conversaciones satisfactorias (rating >= 4)
    const satisfactoryResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE rating >= 4) as satisfactory,
        COUNT(*) FILTER (WHERE rating IS NOT NULL) as total_rated
       FROM conversations WHERE org_id = $1`,
      [orgId]
    );

    const { satisfactory, total_rated } = satisfactoryResult.rows[0];
    const satisfactoryPercent = total_rated > 0
      ? Math.round((satisfactory / total_rated) * 100)
      : 0;

    // Tiempo promedio de respuesta de la IA
    const avgResponseTime = await pool.query(
      `SELECT AVG(response_time_ms) as avg_ms
       FROM messages 
       WHERE org_id = $1 AND role = 'assistant' AND response_time_ms IS NOT NULL`,
      [orgId]
    );

    // Tendencia: conversaciones por día últimos 14 días
    const trend = await pool.query(
      `SELECT 
        DATE(started_at) as date,
        COUNT(*) as count
       FROM conversations
       WHERE org_id = $1 AND started_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [orgId]
    );

    res.json({
      totalToday: parseInt(todayCount.rows[0].count),
      totalWeek: parseInt(weekCount.rows[0].count),
      totalMonth: parseInt(monthCount.rows[0].count),
      satisfactoryPercent,
      avgResponseTimeSeconds: avgResponseTime.rows[0].avg_ms
        ? (avgResponseTime.rows[0].avg_ms / 1000).toFixed(2)
        : 0,
      trend: trend.rows,
    });
  } catch (err) {
    console.error('Error en summary:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Analytics completos
const getAnalytics = async (req, res) => {
  const { orgId } = req.user;

  try {
    // Distribución de ratings
    const ratingDist = await pool.query(
      `SELECT 
        ROUND(rating) as rating,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
       FROM conversations
       WHERE org_id = $1 AND rating IS NOT NULL
       GROUP BY ROUND(rating)
       ORDER BY rating`,
      [orgId]
    );

    // Distribución por canal
    const channelDist = await pool.query(
      `SELECT 
        channel,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
       FROM conversations
       WHERE org_id = $1
       GROUP BY channel`,
      [orgId]
    );

    // Top 5 peores prompts
    const worstPrompts = await pool.query(
      `SELECT 
        m.prompt_used,
        AVG(c.rating) as avg_rating,
        COUNT(DISTINCT c.id) as conversation_count
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.org_id = $1 
         AND m.prompt_used IS NOT NULL 
         AND c.rating IS NOT NULL
       GROUP BY m.prompt_used
       ORDER BY avg_rating ASC
       LIMIT 5`,
      [orgId]
    );

    res.json({
      ratingDistribution: ratingDist.rows,
      channelDistribution: channelDist.rows,
      worstPrompts: worstPrompts.rows,
    });
  } catch (err) {
    console.error('Error en analytics:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAnalytics, getSummary };