/**
 * Service incidents — couche logique métier.
 */
import * as incidentRepo from '../repositories/incidentRepository.js';
import * as auditRepo from '../repositories/auditRepository.js';

export const getAllIncidents = (filters) => incidentRepo.findAll(filters);

export const getIncidentById = async (id) => {
  const incident = await incidentRepo.findById(id);
  if (!incident) throw Object.assign(new Error('Incident introuvable'), { status: 404 });
  return incident;
};

export const createIncident = (data) => {
  if (!data?.citizen_id) {
    throw Object.assign(new Error('Identifiant citoyen manquant — reconnectez-vous.'), { status: 401 });
  }
  if (!data?.category) {
    throw Object.assign(new Error('La catégorie est obligatoire.'), { status: 400 });
  }
  const now = new Date().toISOString();
  const ref_code = `REF-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
  return incidentRepo.create({
    ...data,
    ref_code,
    status: 'nouveau',
    created_at: now,
    updated_at: now,
  });
};

export const updateIncident = async (id, updates, actorId) => {
  const existing = await incidentRepo.findById(id);
  if (!existing) throw Object.assign(new Error('Incident introuvable'), { status: 404 });

  const { audit_comment, ...incidentUpdates } = updates;
  const patch = { ...incidentUpdates, updated_at: new Date().toISOString() };
  const updated = await incidentRepo.update(id, patch);

  if (incidentUpdates.status && incidentUpdates.status !== existing.status) {
    await auditRepo.create({
      incident_id: id,
      actor_id: actorId,
      old_status: existing.status,
      new_status: incidentUpdates.status,
      comment: audit_comment || null,
    });
  }

  return updated;
};

export const deleteIncident = async (id) => {
  const deleted = await incidentRepo.remove(id);
  if (!deleted) throw Object.assign(new Error('Incident introuvable'), { status: 404 });
};
