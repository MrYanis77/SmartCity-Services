/**
 * Contrôleur journal d'audit – couche HTTP.
 *
 * Mince couche Express qui délègue au service audit.
 *
 * Routes associées : /api/audit
 */
import * as auditService from '../services/auditService.js';

/** Liste toutes les entrées d'audit avec filtres optionnels (incident_id, actor_id). */
export const getAll = async (req, res) => {
  try {
    res.json(await auditService.getAllLogs(req.query));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * Crée une entrée d'audit manuellement.
 * Attend : { incident_id, actor_id, old_status?, new_status, comment? }
 */
export const create = async (req, res) => {
  try {
    const log = await auditService.createLog(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};
