/**
 * Service audit — couche logique métier.
 *
 * Gère l'accès au journal d'audit des changements de statut des incidents.
 * La création d'entrées est en général déclenchée par `incidentService.updateIncident`.
 *
 * Toutes les interactions DB passent par `auditRepository`.
 */
import * as auditRepo from '../repositories/auditRepository.js';

/**
 * Retourne toutes les entrées d'audit avec filtres optionnels.
 * @param {{ incident_id?: number, actor_id?: number }} filters
 * @returns {Promise<object[]>}
 */
export const getAllLogs = (filters) => auditRepo.findAll(filters);

/**
 * Crée manuellement une entrée d'audit.
 * Dans la plupart des cas, préférer `incidentService.updateIncident` qui crée l'entrée automatiquement.
 *
 * @param {{ incident_id: number, actor_id: number, old_status?: string, new_status: string, comment?: string }} data
 * @returns {Promise<object>}
 */
export const createLog = (data) => auditRepo.create(data);
