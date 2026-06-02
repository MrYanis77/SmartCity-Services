/**
 * Repository incidents — couche d'accès aux données.
 */
import db from '../../db/index.js';

const parseId = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
};

/**
 * Retourne les incidents avec filtres optionnels.
 */
export const findAll = (filters = {}) => {
  const agentId = parseId(filters.agent_id);
  if (agentId !== undefined) {
    return findAllForAgent(agentId);
  }

  let query = db('incidents').orderBy('created_at', 'desc');
  const citizenId = parseId(filters.citizen_id);
  if (filters.status) query = query.where('status', filters.status);
  if (filters.category) query = query.where('category', filters.category);
  if (citizenId !== undefined) query = query.where('citizen_id', citizenId);
  return query;
};

/**
 * Incidents assignés à un agent : agent_id direct OU liés via interventions.
 */
export const findAllForAgent = (agentId) => {
  const id = parseId(agentId);
  if (id === undefined) return Promise.resolve([]);

  return db('incidents')
    .where(function () {
      this.where('agent_id', id).orWhereIn('id', function () {
        this.select('incident_id').from('interventions').where('agent_id', id);
      });
    })
    .orderBy('created_at', 'desc');
};

/**
 * Vérifie si un incident est assigné à un agent (direct ou via intervention).
 */
export const isAssignedToAgent = async (incidentId, agentId) => {
  const incId = parseId(incidentId);
  const agId = parseId(agentId);
  if (incId === undefined || agId === undefined) return false;

  const incident = await db('incidents').where('id', incId).first();
  if (!incident) return false;
  if (incident.agent_id === agId) return true;

  const interv = await db('interventions')
    .where({ incident_id: incId, agent_id: agId })
    .first();
  return !!interv;
};

export const findById = (id) => db('incidents').where('id', id).first();

export const create = async (data) => {
  const [insertedId] = await db('incidents').insert(data);
  return findById(insertedId);
};

export const update = async (id, updates) => {
  await db('incidents').where('id', id).update(updates);
  return findById(id);
};

export const syncAgentIdFromInterventions = async (incidentId) => {
  const id = parseId(incidentId);
  if (id === undefined) return;

  const latest = await db('interventions')
    .where('incident_id', id)
    .orderBy('scheduled_date', 'desc')
    .first();

  await db('incidents').where('id', id).update({
    agent_id: latest ? latest.agent_id : null,
  });
};

export const anonymizeByCitizen = (citizenId) =>
  db('incidents').where('citizen_id', citizenId).update({ citizen_id: null });

export const remove = (id) => db('incidents').where('id', id).delete();
