# AI Conversations Dashboard

Dashboard avanzado para monitorear conversaciones de agentes de IA con soporte multi-tenancy, streaming en tiempo real y observabilidad.

![CI](https://github.com/reneallard0127/ai-conversations-dashboard/actions/workflows/ci.yml/badge.svg)

## 🌐 Demo en vivo

**Frontend:** https://scintillating-miracle-production-2805.up.railway.app

**Backend API:** https://ai-conversations-dashboard-production.up.railway.app

Cuentas de prueba:
- carlos@techstore.com / password123 (TechStore)
- maria@fashionshop.com / password123 (FashionShop)

## 🚀 Cómo arrancar (Docker)

### Requisitos
- Docker Desktop instalado y corriendo
- Git

### Pasos

1. Clonar el repositorio:
```bash
git clone https://github.com/reneallard0127/ai-conversations-dashboard.git
cd ai-conversations-dashboard
```

2. Crear archivo `.env` en la raíz con estas variables:
```env
POSTGRES_USER=dashboard_user
POSTGRES_PASSWORD=admin123
POSTGRES_DB=ai_dashboard
DATABASE_URL=postgresql://dashboard_user:admin123@postgres:5432/ai_dashboard
JWT_SECRET=supersecretkey_cambiar_en_produccion_2024
GEMINI_API_KEY=tu_api_key_de_openrouter_aqui
PORT=4000
NODE_ENV=development
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

3. Levantar todos los servicios:
```bash
docker compose up --build
```

4. Abrir en el navegador:
- **Frontend:** http://localhost:5173
- **Grafana:** http://localhost:3000 (admin / admin123)
- **Prometheus:** http://localhost:9090

### Cuentas de prueba
| Usuario | Email | Contraseña | Organización |
|---------|-------|------------|--------------|
| Carlos Admin | carlos@techstore.com | password123 | TechStore |
| María Admin | maria@fashionshop.com | password123 | FashionShop |

---

## 🏗️ Arquitectura

```mermaid
graph TB
    U[Usuario] -->|HTTPS| F[Frontend React :5173]
    F -->|REST API| B[Backend Node.js :4000]
    F -->|WebSocket WSS| B
    B -->|SQL| DB[(PostgreSQL :5432)]
    B -->|HTTP Stream| AI[OpenRouter API]
    B -->|Métricas| P[Prometheus :9090]
    P -->|Datasource| G[Grafana :3000]

    subgraph Docker Compose
        F
        B
        DB
        P
        G
    end

    subgraph Railway Deploy
        F2[Frontend nginx]
        B2[Backend Node.js]
        DB2[(PostgreSQL)]
    end
```
---
## 🧠 Decisiones de Arquitectura

### Backend
- **Node.js + Express** — liviano, excelente soporte para WebSockets y streams
- **PostgreSQL** — base de datos relacional robusta con soporte nativo para UUID y queries complejas
- **WebSockets nativos (ws)** — elegido sobre Socket.io por menor overhead y control total del protocolo
- **prom-client** — instrumentación de métricas Prometheus directamente en el proceso Node.js

### Frontend
- **React + Vite** — build ultrarrápido en desarrollo, HMR instantáneo
- **Tailwind CSS** — utility-first, permite iterar el diseño rápidamente sin CSS custom
- **Recharts** — librería de gráficos declarativa, integración natural con React
- **React Router v6** — rutas anidadas con layouts compartidos

### Multi-tenancy
- Cada tabla tiene columna `org_id` como foreign key
- Todas las queries filtran por `org_id` extraído del JWT
- El JWT contiene `orgId` en sus claims — nunca se confía en el body del request para el tenant

### Streaming
- El backend recibe el stream SSE de OpenRouter y lo re-transmite token a token via WebSocket al frontend
- El frontend acumula los tokens en estado local y los renderiza progresivamente

---

## 🤖 Herramientas de IA usadas

- **Claude (Anthropic)** — generación de todo el código del proyecto (backend, frontend, infraestructura)
- **OpenRouter API** — proveedor de IA para las respuestas del chatbot (modelo: tencent/hy3-preview:free)

---

## ✨ Mejoras UX detectadas e implementadas

1. **Login con panel split** — panel izquierdo con branding y métricas, panel derecho con formulario. Mejora la percepción de producto profesional vs. un simple formulario.

2. **KPIs con semáforo de colores** — verde/amarillo/rojo según umbrales configurados. El usuario de Customer Success puede identificar problemas de un vistazo sin leer números.

3. **Cuentas de demo clickeables** — en el login, hacer clic en una cuenta la autocompleta. Reduce fricción para evaluadores y demos.

4. **Streaming token por token** — la respuesta de la IA aparece progresivamente, dando feedback inmediato al usuario de que el sistema está respondiendo.

5. **Real-time con WebSockets** — nuevas conversaciones aparecen en la tabla sin refrescar, múltiples tabs/usuarios se sincronizan automáticamente.

6. **Gráfico de área vs línea** — el gráfico de tendencia usa AreaChart con gradiente, visualmente más impactante para mostrar crecimiento.

7. **Avatar removido del perfil principal** — el avatar de DiceBear SVG causaba problemas de escala. Se mantiene solo en la sidebar donde el tamaño está controlado.

---

## 📊 Observabilidad

Grafana disponible en `http://localhost:3000` (admin/admin123) con dashboard pre-provisionado que muestra:
- Request rate (req/s)
- Latencia p95
- Tasa de errores 5xx
- Latencia de la API de IA
- Conexiones WebSocket activas

Prometheus disponible en `http://localhost:9090`

Métricas expuestas en `http://localhost:4000/metrics`

---

## 📋 Alcance

### ✅ Implementado
- Autenticación JWT con multi-tenancy (org_id en claims)
- CRUD de conversaciones y mensajes
- Streaming de respuestas IA vía WebSockets (token por token)
- Calificación de conversaciones (1-5 estrellas)
- Dashboard con KPIs, gráficos de tendencia, distribución de ratings y canales
- Top 5 prompts con peor rating
- Filtros en tabla de conversaciones (estado, canal, rating, fechas)
- Paginación en tabla de conversaciones
- 4 personalidades de IA configurables + CRUD de prompts
- Real-time: nuevas conversaciones aparecen sin refrescar
- Dockerizado completo (backend + frontend + PostgreSQL + Grafana + Prometheus)
- CI Pipeline con GitHub Actions (lint + build)
- Datos semilla: 2 organizaciones, usuarios y conversaciones simuladas
- Grafana con datasource y dashboard pre-provisionados

### ⚠️ Pendiente (fuera del deadline)
- **Terraform + Deploy en IaaS** — requiere configuración de cuenta cloud con tarjeta de crédito y tiempo de configuración adicional. La aplicación está completamente funcional en local vía Docker.
- **URL de deploy funcional** — pendiente del punto anterior
- **Testing automatizado** — no requerido según el enunciado pero documentado como mejora futura

---

## 🔧 Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | Nombre de la base de datos |
| `DATABASE_URL` | URL completa de conexión a PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar JWT |
| `GEMINI_API_KEY` | API key de OpenRouter |
| `PORT` | Puerto del backend (default: 4000) |
| `NODE_ENV` | Entorno (development/production) |
| `VITE_API_URL` | URL del backend para el frontend |
| `VITE_WS_URL` | URL WebSocket del backend |

## 💬 Comentarios e indicaciones adicionales

### Para el evaluador
- El deploy está en Railway (free tier) — puede haber cold starts de ~30 segundos si el servicio estuvo inactivo
- El WebSocket en producción usa ping/pong cada 20s para mantener la conexión viva en Railway
- El modelo de IA usado es `tencent/hy3-preview:free` via OpenRouter — es gratuito pero puede tener latencia variable
- Si el chatbot no responde, esperar 5 segundos y reintentar — puede ser rate limit del modelo gratuito
- Terraform no fue implementado por limitaciones de tiempo — el deploy se realizó directamente en Railway

### Notas técnicas
- La sección de Terraform está documentada como pendiente en el README pero el deploy funcional está disponible en Railway
- El `.env` no se sube a GitHub por seguridad — las variables están configuradas directamente en Railway
- Grafana y Prometheus solo están disponibles en el entorno local (Docker), no en el deploy de Railway por limitaciones del free tier