/**
 * Service interventions — couche logique métier.
 */
import * as interventionRepo from '../repositories/interventionRepository.js';
import * as incidentRepo from '../repositories/incidentRepository.js';

export const getAllInterventions = (filters, { enriched = true } = {}) =>
  enriched ? interventionRepo.findAllEnriched(filters) : interventionRepo.findAll(filters);

export const getInterventionById = async (id) => {
  const item = await interventionRepo.findById(id);
  if (!item) throw Object.assign(new Error('Intervention introuvable'), { status: 404 });
  return item;
};

export const createIntervention = async (data) => {
  const item = await interventionRepo.create(data);
  if (data.incident_id && data.agent_id) {
    await incidentRepo.update(data.incident_id, { agent_id: data.agent_id });
  }
  return item;
};

export const updateIntervention = async (id, updates) => {
  const existing = await interventionRepo.findById(id);
  if (!existing) throw Object.assign(new Error('Intervention introuvable'), { status: 404 });

  const updated = await interventionRepo.update(id, updates);
  if (!updated) throw Object.assign(new Error('Intervention introuvable'), { status: 404 });

  const incidentId = updates.incident_id ?? existing.incident_id;
  await incidentRepo.syncAgentIdFromInterventions(incidentId);

  return updated;
};

export const deleteIntervention = async (id) => {
  const existing = await interventionRepo.findById(id);
  if (!existing) throw Object.assign(new Error('Intervention introuvable'), { status: 404 });

  const incidentId = existing.incident_id;
  await interventionRepo.remove(id);
  await incidentRepo.syncAgentIdFromInterventions(incidentId);
};

/** Répare incidents.agent_id à partir des interventions existantes. */
export const syncAllAgentAssignments = async () => {
  const rows = await interventionRepo.findAll({});
  const incidentIds = [...new Set(rows.map((r) => r.incident_id))];
  for (const incidentId of incidentIds) {
    await incidentRepo.syncAgentIdFromInterventions(incidentId);
  }
};
