const { Pool } = require('pg');

// Pool de conexiones a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Inicializar la base de datos: crear tablas y datos semilla
const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log('📦 Inicializando base de datos...');

    // Tabla de organizaciones (multi-tenancy)
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabla de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabla de prompts (personalidades de la IA)
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabla de conversaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        channel VARCHAR(50) DEFAULT 'Web',
        status VARCHAR(20) DEFAULT 'open',
        rating DECIMAL(3,2),
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        duration_seconds INTEGER
      )
    `);

    // Tabla de mensajes
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        prompt_used TEXT,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insertar datos semilla si no existen
    await seedData(client);

    console.log('✅ Base de datos inicializada correctamente');
  } finally {
    client.release();
  }
};

// Datos iniciales: 2 organizaciones, usuarios y conversaciones de ejemplo
const seedData = async (client) => {
  // Verificar si ya hay datos
  const { rows } = await client.query('SELECT COUNT(*) FROM organizations');
  if (parseInt(rows[0].count) > 0) return;

  console.log('🌱 Insertando datos semilla...');
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Organización 1: TechStore
  const org1 = await client.query(
    `INSERT INTO organizations (name) VALUES ('TechStore') RETURNING id`
  );
  const org1Id = org1.rows[0].id;

  // Organización 2: FashionShop
  const org2 = await client.query(
    `INSERT INTO organizations (name) VALUES ('FashionShop') RETURNING id`
  );
  const org2Id = org2.rows[0].id;

  // Usuario org1
  const user1 = await client.query(
    `INSERT INTO users (org_id, name, email, password, avatar_url) 
     VALUES ($1, 'Carlos Admin', 'carlos@techstore.com', $2, 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos')
     RETURNING id`,
    [org1Id, hashedPassword]
  );

  // Usuario org2
  const user2 = await client.query(
    `INSERT INTO users (org_id, name, email, password, avatar_url)
     VALUES ($1, 'María Admin', 'maria@fashionshop.com', $2, 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria')
     RETURNING id`,
    [org2Id, hashedPassword]
  );

  // Prompts para org1
  const prompts1 = [
    { name: 'Asistente Formal', content: 'Eres un asistente profesional y formal. Respondes de manera clara, concisa y educada. Siempre tratas al usuario de "usted".', isDefault: true },
    { name: 'Joven Simpático', content: 'Eres un asistente joven y simpático. Usas lenguaje casual, emojis ocasionalmente y eres muy entusiasta. Tratas al usuario de "tú".', isDefault: false },
    { name: 'Experto Técnico', content: 'Eres un experto técnico muy detallado. Das respuestas exhaustivas con datos precisos y referencias técnicas cuando es posible.', isDefault: false },
    { name: 'Gringo Español', content: 'You are an assistant that tries to speak Spanish but mixes English words constantly because you are still learning. Be helpful but struggle with Spanish grammar sometimes.', isDefault: false },
  ];

  for (const p of prompts1) {
    await client.query(
      `INSERT INTO prompts (org_id, name, content, is_default) VALUES ($1, $2, $3, $4)`,
      [org1Id, p.name, p.content, p.isDefault]
    );
  }

  // Prompts para org2 (copias)
  for (const p of prompts1) {
    await client.query(
      `INSERT INTO prompts (org_id, name, content, is_default) VALUES ($1, $2, $3, $4)`,
      [org2Id, p.name, p.content, p.isDefault]
    );
  }

  // Generar conversaciones simuladas de los últimos 30 días
  const channels = ['Web', 'WhatsApp', 'Instagram'];
  const statuses = ['open', 'closed'];

  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const rating = (Math.random() * 4 + 1).toFixed(1);
    const duration = Math.floor(Math.random() * 300) + 30;

    const conv = await client.query(
      `INSERT INTO conversations (org_id, user_id, channel, status, rating, started_at, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [org1Id, user1.rows[0].id, channel, status, rating, date, duration]
    );

    // 2-3 mensajes por conversación
    const sampleMessages = [
      { role: 'user', content: '¿Cuál es el precio del iPhone 15?' },
      { role: 'assistant', content: 'El iPhone 15 tiene un precio de $799 USD en su versión base.' },
      { role: 'user', content: '¿Tienen stock disponible?' },
    ];

    for (const msg of sampleMessages) {
      await client.query(
        `INSERT INTO messages (conversation_id, org_id, role, content, response_time_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [conv.rows[0].id, org1Id, msg.role, msg.content, Math.floor(Math.random() * 2000) + 200, date]
      );
    }
  }

  // 20 conversaciones para org2
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const rating = (Math.random() * 4 + 1).toFixed(1);
    const duration = Math.floor(Math.random() * 300) + 30;

    await client.query(
      `INSERT INTO conversations (org_id, user_id, channel, status, rating, started_at, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [org2Id, user2.rows[0].id, channel, status, rating, date, duration]
    );
  }

  console.log('✅ Datos semilla insertados');
  console.log('👤 Usuario 1: carlos@techstore.com / password123');
  console.log('👤 Usuario 2: maria@fashionshop.com / password123');
};

module.exports = { pool, initDB };