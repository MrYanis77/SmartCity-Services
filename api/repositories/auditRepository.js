/**
 * Repository journal d'audit — couche d'accès aux données.
 *
 * Encapsule toutes les requêtes Knex sur la table `audit_log`.
 * Chaque entrée retrace un changement de statut d'un incident avec l'acteur responsable.
 */
import db from '../../db/index.js';

/**
 * Retourne les entrées d'audit avec filtres optionnels, triées de la plus récente à la plus ancienne.
 * @param {{ incident_id?: number, actor_id?: number }} filters
 * @returns {Promise<object[]>}
 */
export const findAll = (filters = {}) => {
  let query = db('audit_log').orderBy('created_at', 'desc');
  if (filters.incident_id) query = query.where('incident_id', filters.incident_id);
  if (filters.actor_id)    query = query.where('actor_id', filters.actor_id);
  return query;
};

/**
 * Retourne une entrée d'audit par son identifiant.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
export const findById = (id) => db('audit_log').where('id', id).first();

/**
 * Insère une nouvelle entrée d'audit et retourne l'enregistrement créé.
 * @param {object} data - { incident_id, actor_id, old_status?, new_status, comment? }
 * @returns {Promise<object>}
 */
export const create = async (data) => {
  const [id] = await db('audit_log').insert(data);
  return findById(id);
};
