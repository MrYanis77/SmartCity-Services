/**
 * Routes d'authentification — /api/auth
 *
 * Endpoints publics (non protégés par le middleware JWT) :
 *   POST /api/auth/login   — connexion avec email + mot de passe
 *   POST /api/auth/refresh — renouvellement du token d'accès via refresh token
 *   POST /api/auth/logout  — révocation du refresh token
 *
 * Le token d'accès (accessToken) expire après 1 heure.
 * Le refresh token expire après 7 jours.
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../middleware/auth.js';
import * as userService from '../services/userService.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '30', 10),
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
const JWT_SECRET         = process.env.JWT_SECRET         || 'smartcity_dev_secret_CHANGE_IN_PROD';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'smartcity_refresh_secret_CHANGE_IN_PROD';

/**
 * Génère un access token JWT (expiration 1h).
 * @param {{ id: number, email: string, role: string }} user
 * @returns {string}
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Génère un refresh token JWT (expiration 7j).
 * @param {{ id: number }} user
 * @returns {string}
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/login
 * Corps : { email: string, password: string }
 * Réponse : { accessToken, refreshToken, user }
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    // Vérifie les identifiants via bcrypt
    const user = await userService.verifyCredentials(email, password);

    // Génère les deux tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Stocke le refresh token haché en base (révocable)
    await userService.saveRefreshToken(user.id, refreshToken);

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/refresh
 * Corps : { refreshToken: string }
 * Réponse : { accessToken }
 * Permet au renderer de renouveler le token d'accès sans re-saisir les identifiants.
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token manquant.' });
    }

    // Vérifie la signature et l'expiration du refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
    }

    // Vérifie que le token correspond bien au hash stocké en base
    const valid = await userService.verifyRefreshToken(payload.sub, refreshToken);
    if (!valid) {
      return res.status(401).json({ error: 'Refresh token révoqué.' });
    }

    // Récupère l'utilisateur pour régénérer un access token complet
    const user = await userService.getUserById(payload.sub);
    const accessToken = generateAccessToken(user);

    res.json({ accessToken });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/logout
 * Corps : { userId: number }
 * Révoque le refresh token en base (déconnexion sécurisée).
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    await userService.revokeRefreshToken(req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
