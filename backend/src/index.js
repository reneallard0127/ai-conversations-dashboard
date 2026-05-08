require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initDB } = require('./config/database');
const { initWebSocket } = require('./services/websocket');
const { collectDefaultMetrics, register } = require('prom-client');

// Importar rutas
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const configRoutes = require('./routes/config');

const app = express();
const server = http.createServer(app);

// Métricas de Prometheus
collectDefaultMetrics();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://frontend:5173',
    'https://scintillating-miracle-production-2805.up.railway.app',
    /\.railway\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/config', configRoutes);

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicializar WebSocket
initWebSocket(server);

const PORT = process.env.PORT || 4000;

// Inicializar BD y arrancar servidor
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en puerto ${PORT}`);
    console.log(`📊 Métricas disponibles en /metrics`);
  });
}).catch(err => {
  console.error('Error iniciando la base de datos:', err);
  process.exit(1);
});