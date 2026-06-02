/**
 * Filtrage et autorisation des données par rôle JWT.
 */
import { resolveUserId } from './auth.js';

const parseId = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
};

/** Construit les filtres GET /api/incidents selon le rôle. */
export function buildIncidentQueryFilters(req, query = {}) {
  const role = req.user?.role;
  const filters = { ...query };
  const userId = resolveUserId(req);

  if (role === 'citoyen') {
    return {
      status: filters.status,
      category: filters.category,
      citizen_id: userId,
    };
  }

  if (role === 'agent') {
    return {
      status: filters.status,
      category: filters.category,
      agent_id: userId,
    };
  }

  return {
    status: filters.status,
    category: filters.category,
    citizen_id: parseId(filters.citizen_id),
    agent_id: parseId(filters.agent_id),
  };
}

/** Construit les filtres GET /api/interventions selon le rôle. */
export function buildInterventionQueryFilters(req, query = {}) {
  const role = req.user?.role;
  const userId = resolveUserId(req);

  if (role === 'citoyen') {
    return null;
  }

  if (role === 'agent') {
    return {
      incident_id: parseId(query.incident_id),
      agent_id: userId,
    };
  }

  return {
    incident_id: parseId(query.incident_id),
    agent_id: parseId(query.agent_id),
  };
}

export function assertCanCreateIncident(req) {
  if (req.user?.role !== 'citoyen') {
    throw Object.assign(new Error('Seuls les citoyens peuvent créer un signalement'), { status: 403 });
  }
}

export async function assertCanReadIncident(req, incident) {
  const role = req.user?.role;
  if (!incident) {
    throw Object.assign(new Error('Incident introuvable'), { status: 404 });
  }
  if (role === 'responsable' || role === 'admin') return;
  const userId = resolveUserId(req);
  if (role === 'citoyen' && Number(incident.citizen_id) === userId) return;
  if (role === 'agent') {
    const { isAssignedToAgent } = await import('../repositories/incidentRepository.js');
    if (await isAssignedToAgent(incident.id, userId)) return;
  }
  throw Object.assign(new Error('Accès refusé'), { status: 403 });
}

export async function assertCanUpdateIncident(req, incidentId) {
  const role = req.user?.role;
  const { findById, isAssignedToAgent } = await import('../repositories/incidentRepository.js');
  const incident = await findById(incidentId);
  if (!incident) throw Object.assign(new Error('Incident introuvable'), { status: 404 });

  if (role === 'responsable' || role === 'admin') return incident;
  const userId = resolveUserId(req);
  if (role === 'agent' && await isAssignedToAgent(incidentId, userId)) return incident;
  throw Object.assign(new Error('Accès refusé'), { status: 403 });
}

export function assertCanWriteIntervention(req) {
  if (req.user?.role !== 'responsable') {
    throw Object.assign(new Error('Accès refusé'), { status: 403 });
  }
}

export async function assertCanUpdateIntervention(req, interventionId, body) {
  const role = req.user?.role;
  const { findById } = await import('../repositories/interventionRepository.js');
  const item = await findById(interventionId);
  if (!item) throw Object.assign(new Error('Intervention introuvable'), { status: 404 });

  if (role === 'responsable') return item;

  if (role === 'agent') {
    const userId = resolveUserId(req);
    if (Number(item.agent_id) !== userId) {
      throw Object.assign(new Error('Accès refusé'), { status: 403 });
    }
    const allowed = ['comment'];
    const keys = Object.keys(body || {});
    const invalid = keys.filter((k) => !allowed.includes(k));
    if (invalid.length > 0) {
      throw Object.assign(new Error('Modification limitée au commentaire'), { status: 403 });
    }
    return item;
  }

  throw Object.assign(new Error('Accès refusé'), { status: 403 });
}

export async function assertCanDeleteIntervention(req) {
  assertCanWriteIntervention(req);
}
