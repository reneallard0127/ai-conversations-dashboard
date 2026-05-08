let ws = null;
let listeners = {};
let reconnectTimer = null;
let pingTimer = null;
let currentToken = null;

export const connectWebSocket = (token) => {
  currentToken = token;
  _connect(token);
};

const _connect = (token) => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
  
  try {
    ws = new WebSocket(`${wsUrl}?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      // Ping cada 20 segundos para mantener conexión viva
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'PONG') return;
        if (listeners[message.type]) {
          listeners[message.type].forEach(cb => cb(message));
        }
        if (listeners['*']) {
          listeners['*'].forEach(cb => cb(message));
        }
      } catch (err) {
        console.error('Error parseando mensaje WS:', err);
      }
    };

    ws.onerror = () => {
      console.log('WebSocket error, reintentando en 3s...');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado, reintentando en 3s...');
      if (pingTimer) clearInterval(pingTimer);
      reconnectTimer = setTimeout(() => {
        if (currentToken) _connect(currentToken);
      }, 3000);
    };
  } catch (err) {
    console.error('Error creando WebSocket:', err);
  }
};

export const onMessage = (type, callback) => {
  if (!listeners[type]) listeners[type] = [];
  listeners[type].push(callback);
  return () => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter(cb => cb !== callback);
    }
  };
};

export const sendMessage = (data) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  } else {
    setTimeout(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }, 1000);
    return false;
  }
};

export const disconnectWebSocket = () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (pingTimer) clearInterval(pingTimer);
  currentToken = null;
  if (ws) {
    ws.close();
    ws = null;
  }
  listeners = {};
};