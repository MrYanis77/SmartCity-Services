// api/server.js - Serveur Express complet
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import db from '../db/index.js';

// Import des routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import incidentRoutes from './routes/incidents.js';
import interventionRoutes from './routes/interventions.js';
import auditRoutes from './routes/audit.js';
import uploadRoutes from './routes/uploads.js';
import { geocodeAddress as geocodeAddressService } from './lib/geocode.js';
import { swaggerUi, swaggerSpec, swaggerUiOptions } from './swagger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: { error: 'Trop de requêtes, réessayez plus tard' },
});

app.use(globalLimiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Spécification OpenAPI (fichiers bruts)
app.get('/api/openapi.yaml', (_req, res) => {
  res.type('text/yaml').sendFile(path.join(__dirname, 'openapi.yaml'));
});
app.get('/api/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

// Documentation Swagger UI — http://localhost:3000/api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/interventions', interventionRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Géocodage (handler direct — évite les 404 si routes modulaires non rechargées)
async function handleGeocode(req, res) {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 5) {
    return res.status(400).json({ error: 'Adresse trop courte.' });
  }
  try {
    const coords = await geocodeAddressService(q);
    if (!coords) return res.json({ latitude: null, longitude: null });
    res.json(coords);
  } catch {
    res.status(502).json({ error: 'Erreur de géocodage.' });
  }
}
app.get('/api/geocode', handleGeocode);
app.get('/api/v1/geocode', handleGeocode);

// Redirections pour compatibilité (sans /v1)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir les photos (uploads/… ou chemin absolu Electron)
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function resolveImagePath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('uploads/')) {
    return path.join(DATA_DIR, normalized);
  }
  return path.resolve(filePath);
}

app.get('/api/images', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Chemin manquant' });
  }
  try {
    const resolved = resolveImagePath(filePath);
    const allowedRoots = [UPLOADS_DIR, DATA_DIR];
    const isAllowed = allowedRoots.some((root) => resolved.startsWith(root));
    if (!isAllowed || !fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }
    res.sendFile(resolved);
  } catch {
    res.status(400).json({ error: 'Chemin invalide' });
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur';
  res.status(statusCode).json({ error: message });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur (migrations puis écoute)
async function start() {
  if (process.env.NODE_ENV === 'test') return;

  await db.migrate.latest();
  console.log('[DB] Migrations applied');

  app.listen(PORT, () => {
    console.log(`[API] Express server running on http://localhost:${PORT}`);
    console.log(`[INFO] Environnement: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('[ERROR] Failed to start server:', err);
  process.exit(1);
});

export default app;
