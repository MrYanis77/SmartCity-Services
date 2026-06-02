/**
 * Upload de fichiers (photos de signalements).
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.js';
import { assertCanCreateIncident } from '../middleware/scopeData.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

router.use(verifyToken);

/** POST /api/uploads/photo — corps JSON { data: base64, filename, mime? } */
router.post('/photo', (req, res) => {
  try {
    assertCanCreateIncident(req);

    const { data, filename, mime } = req.body ?? {};
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Données image manquantes.' });
    }

    const buffer = Buffer.from(data, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Image invalide.' });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'Image trop volumineuse (max 5 Mo).' });
    }

    const extFromMime = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const extFromName = path.extname(filename || '').toLowerCase();
    const ext = extFromMime[mime] ?? (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extFromName) ? extFromName : '.jpg');

    const safeName = `signalement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const absolutePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(absolutePath, buffer);

    // Chemin relatif stocké en base — servi par GET /api/images
    res.status(201).json({ path: `uploads/${safeName}` });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

export default router;
