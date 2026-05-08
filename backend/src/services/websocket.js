const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const orgConnections = new Map();

const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    console.log('🔌 Nueva conexión WebSocket');

    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Token requerido' }));
      ws.close();
      return;
    }

    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Token inválido' }));
      ws.close();
      return;
    }

    const { orgId, userId } = userData;
    ws.orgId = orgId;
    ws.userId = userId;

    if (!orgConnections.has(orgId)) {
      orgConnections.set(orgId, new Set());
    }
    orgConnections.get(orgId).add(ws);

    console.log(`✅ Usuario ${userId} conectado a org ${orgId}`);
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Conectado correctamente' }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);

        // Responder al ping para mantener conexión viva en Railway
        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        if (message.type === 'SEND_MESSAGE') {
          await handleChatMessage(ws, message, userData);
        }
      } catch (err) {
        console.error('Error procesando mensaje WebSocket:', err);
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Error procesando mensaje' }));
      }
    });

    ws.on('close', () => {
      console.log(`🔌 Usuario ${userId} desconectado`);
      const connections = orgConnections.get(orgId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          orgConnections.delete(orgId);
        }
      }
    });
  });

  console.log('🔌 WebSocket server iniciado');
  return wss;
};

const handleChatMessage = async (ws, message, userData) => {
  const { conversationId, content } = message;
  const { orgId } = userData;

  const convResult = await pool.query(
    `SELECT * FROM conversations WHERE id = $1 AND org_id = $2`,
    [conversationId, orgId]
  );

  if (convResult.rows.length === 0) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Conversación no encontrada' }));
    return;
  }

  const promptResult = await pool.query(
    `SELECT content FROM prompts WHERE org_id = $1 AND is_default = TRUE LIMIT 1`,
    [orgId]
  );
  const systemPrompt = promptResult.rows[0]?.content || 'Eres un asistente útil.';

  await pool.query(
    `INSERT INTO messages (conversation_id, org_id, role, content, created_at)
     VALUES ($1, $2, 'user', $3, NOW())`,
    [conversationId, orgId, content]
  );

  ws.send(JSON.stringify({
    type: 'MESSAGE_SAVED',
    data: { role: 'user', content, conversationId }
  }));

  const historyResult = await pool.query(
    `SELECT role, content FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  const startTime = Date.now();
  ws.send(JSON.stringify({ type: 'AI_STREAM_START' }));

  try {
    const fullResponse = await streamGeminiResponse(ws, systemPrompt, historyResult.rows);
    const responseTime = Date.now() - startTime;

    await pool.query(
      `INSERT INTO messages (conversation_id, org_id, role, content, prompt_used, response_time_ms, created_at)
       VALUES ($1, $2, 'assistant', $3, $4, $5, NOW())`,
      [conversationId, orgId, fullResponse, systemPrompt, responseTime]
    );

    ws.send(JSON.stringify({
      type: 'AI_STREAM_END',
      data: { role: 'assistant', content: fullResponse, responseTime }
    }));

  } catch (err) {
    console.error('Error con Gemini:', err);
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Error al conectar con la IA' }));
  }
};

const streamGeminiResponse = async (ws, systemPrompt, history) => {
  const fetch = require('node-fetch');
  const apiKey = process.env.GEMINI_API_KEY;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
  ];

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'tencent/hy3-preview:free',
        messages,
        stream: true,
        max_tokens: 1024,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  let fullResponse = '';

  for await (const chunk of response.body) {
    const text = chunk.toString();
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed?.choices?.[0]?.delta?.content;

          if (token) {
            fullResponse += token;
            ws.send(JSON.stringify({
              type: 'AI_STREAM_TOKEN',
              token
            }));
          }
        } catch (e) {
          // ignorar líneas no JSON
        }
      }
    }
  }

  return fullResponse;
};

const broadcastToOrg = (orgId, message) => {
  const connections = orgConnections.get(orgId);
  if (!connections) return;

  const payload = JSON.stringify(message);
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
};

module.exports = { initWebSocket, broadcastToOrg };