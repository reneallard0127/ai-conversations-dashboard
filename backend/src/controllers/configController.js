const { pool } = require('../config/database');

// Mostrar configuración (sin exponer la API key completa)
const getConfig = async (req, res) => {
  res.json({
    aiProvider: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent',
    apiKey: process.env.GEMINI_API_KEY
      ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...`
      : 'No configurada',
    model: 'gemini-2.0-flash',
  });
};

// Obtener prompts de la organización
const getPrompts = async (req, res) => {
  const { orgId } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM prompts WHERE org_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [orgId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo prompts' });
  }
};

// Cambiar prompt por defecto
const setDefaultPrompt = async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE prompts SET is_default = FALSE WHERE org_id = $1`,
      [orgId]
    );
    const { rows } = await pool.query(
      `UPDATE prompts SET is_default = TRUE WHERE id = $1 AND org_id = $2 RETURNING *`,
      [id, orgId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Prompt no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando prompt' });
  }
};

// Crear nuevo prompt
const createPrompt = async (req, res) => {
  const { orgId } = req.user;
  const { name, content } = req.body;
  if (!name || !content) return res.status(400).json({ error: 'Nombre y contenido requeridos' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO prompts (org_id, name, content) VALUES ($1, $2, $3) RETURNING *`,
      [orgId, name, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creando prompt' });
  }
};

// Eliminar prompt
const deletePrompt = async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  try {
    await pool.query(
      `DELETE FROM prompts WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando prompt' });
  }
};

module.exports = { getConfig, getPrompts, setDefaultPrompt, createPrompt, deletePrompt };