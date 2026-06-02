import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_dev_secret_CHANGE_IN_PROD';

export function verifyToken(req, res, next) {
  // Essaye d'obtenir le token du header Authorization (Bearer token)
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7); // Enlève 'Bearer ' (7 caractères)
  } else {
    // Fallback : cherche dans les cookies
    token = req.cookies?.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token manquant', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rawId = decoded.sub ?? decoded.id;
    const userId = rawId != null ? parseInt(rawId, 10) : undefined;
    req.userId = Number.isNaN(userId) ? undefined : userId;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré. Veuillez vous reconnecter.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide ou expiré', code: 'INVALID_TOKEN' });
  }
}

/** ID utilisateur JWT normalisé (number). */
export function resolveUserId(req) {
  const raw = req.userId ?? req.user?.sub ?? req.user?.id;
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? undefined : id;
}

export function isOwner(req, res, next) {
  const targetUserId = parseInt(req.params.userId, 10);
  if (resolveUserId(req) !== targetUserId) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
}

/** Restreint l'accès aux rôles autorisés (après verifyToken). */
export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}
