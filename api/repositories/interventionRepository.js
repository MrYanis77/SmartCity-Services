/**
 * Repository interventions — couche d'accès aux données.
 */
import db from '../../db/index.js';

const parseId = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
};

const INTERVENTION_COLS = [
  'interventions.id',
  'interventions.incident_id',
  'interventions.agent_id',
  'interventions.scheduled_date',
  'interventions.comment',
  'interventions.photo_result_path',
  'interventions.resolved_at',
];

const INCIDENT_COLS = [
  'incidents.ref_code as incident_ref_code',
  'incidents.description as incident_description',
  'incidents.status as incident_status',
  'incidents.address as incident_address',
  'incidents.category as incident_category',
  'incidents.priority as incident_priority',
];

export const findAll = (filters = {}) => {
  let query = db('interventions').orderBy('scheduled_date', 'asc');
  const incidentId = parseId(filters.incident_id);
  const agentId = parseId(filters.agent_id);
  if (incidentId !== undefined) query = query.where('incident_id', incidentId);
  if (agentId !== undefined) query = query.where('agent_id', agentId);
  return query;
};

/**
 * Interventions avec données incident jointes (planning agent).
 */
export const findAllEnriched = (filters = {}) => {
  let query = db('interventions')
    .join('incidents', 'interventions.incident_id', 'incidents.id')
    .select([...INTERVENTION_COLS, ...INCIDENT_COLS])
    .orderBy('interventions.scheduled_date', 'asc');

  const incidentId = parseId(filters.incident_id);
  const agentId = parseId(filters.agent_id);
  if (incidentId !== undefined) query = query.where('interventions.incident_id', incidentId);
  if (agentId !== undefined) query = query.where('interventions.agent_id', agentId);
  return query;
};

export const findById = (id) => db('interventions').where('id', id).first();

export const findByIncident = (incidentId) =>
  db('interventions').where('incident_id', incidentId).orderBy('scheduled_date', 'desc');

export const create = async (data) => {
  const [insertedId] = await db('interventions').insert(data);
  return findById(insertedId);
};

export const update = async (id, updates) => {
  await db('interventions').where('id', id).update(updates);
  return findById(id);
};

export const remove = (id) => db('interventions').where('id', id).delete();
