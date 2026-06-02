/**
 * Géocodage adresse — proxy Nominatim (évite CORS côté renderer).
 */
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 5) {
    return res.status(400).json({ error: 'Adresse trop courte.' });
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'fr', 'User-Agent': 'SmartCityApp/1.0 (dev)' },
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Service de géocodage indisponible.' });
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ latitude: null, longitude: null });
    }
    res.json({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    });
  } catch {
    res.status(502).json({ error: 'Erreur de géocodage.' });
  }
});

export default router;
