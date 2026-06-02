/**
 * Enregistrement des photos de signalements sur disque.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * @returns {string} Chemin relatif `uploads/…` stocké en base
 */
export function savePhotoFromBase64(data, filename = '', mime = '') {
  if (!data || typeof data !== 'string') {
    throw Object.assign(new Error('Données image manquantes.'), { status: 400 });
  }

  const buffer = Buffer.from(data, 'base64');
  if (buffer.length === 0) {
    throw Object.assign(new Error('Image invalide.'), { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    throw Object.assign(new Error('Image trop volumineuse (max 5 Mo).'), { status: 400 });
  }

  const extFromMime = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  const extFromName = path.extname(filename).toLowerCase();
  const ext = extFromMime[mime] ?? (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extFromName) ? extFromName : '.jpg');

  const safeName = `signalement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer);
  return `uploads/${safeName}`;
}
