import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDbStatus } from './db/index.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import evaluationsRoutes from './routes/evaluations.routes.js';
import judgesRoutes from './routes/judges.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import auditRoutes from './routes/audit.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Health and DB status
app.get('/api/health', (_req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/judges', judgesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Start server and initialize database
async function startServer() {
  console.log('🔄 [Server] Connecting to database...');
  const status = await initDatabase();
  console.log(`📡 [Server] Database Mode: ${status.type.toUpperCase()} (Connected: ${status.connected})`);

  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 BIIN Judge Portal REST API running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('❌ [Server] Failed to start:', err);
});
