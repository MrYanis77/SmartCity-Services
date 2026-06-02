/**
 * Repository utilisateurs — couche d'accès aux données.
 *
 * Encapsule toutes les requêtes Knex sur la table `users`.
 * Les services appellent ce repository ; les contrôleurs ne touchent pas la DB directement.
 */
import db from '../../db/index.js';

/** Colonnes publiques — exclut le hash du mot de passe et le refresh token */
const PUBLIC_FIELDS = ['id', 'email', 'role', 'full_name', 'phone', 'is_active', 'created_at', 'anonymized_at', 'consent_at'];

/**
 * Retourne les utilisateurs avec filtre optionnel par rôle.
 * @param {{ role?: string }} filters
 * @returns {Promise<object[]>}
 */
export const findAll = (filters = {}) => {
  let q = db('users').select(PUBLIC_FIELDS).orderBy('full_name', 'asc');
  if (filters.role) q = q.where('role', filters.role);
  return q;
};

/**
 * Retourne un utilisateur par son identifiant.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
export const findById = (id) => db('users').select(PUBLIC_FIELDS).where('id', id).first();

/**
 * Retourne un utilisateur par son email (inclut le hash du mot de passe pour l'authentification).
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
export const findByEmail = (email) =>
  db('users')
    .select([...PUBLIC_FIELDS, 'password_hash'])
    .where('email', email)
    .first();

/**
 * Insère un nouvel utilisateur et retourne l'enregistrement créé.
 * @param {object} data - { email, password_hash, role, full_name, phone?, consent_at? }
 * @returns {Promise<object>}
 */
export const create = async (data) => {
  const [id] = await db('users').insert(data);
  return findById(id);
};

/**
 * Met à jour les champs d'un utilisateur (hors password_hash).
 * @param {number} id
 * @param {object} updates
 * @returns {Promise<object|undefined>}
 */
export const update = async (id, updates) => {
  await db('users').where('id', id).update(updates);
  return findById(id);
};

/**
 * Enregistre un refresh token haché pour un utilisateur.
 * @param {number} id
 * @param {string|null} hashedToken - null pour révoquer le token.
 */
export const setRefreshToken = (id, hashedToken) =>
  db('users').where('id', id).update({ refresh_token: hashedToken });

/**
 * Anonymise un utilisateur (droit à l'oubli RGPD).
 * Remplace les données personnelles par des valeurs neutres.
 * @param {number} id
 */
export const anonymize = (id) =>
  db('users').where('id', id).update({
    email: `anon_${id}@supprime.invalid`,
    full_name: 'Utilisateur supprimé',
    phone: null,
    password_hash: '',
    refresh_token: null,
    anonymized_at: new Date().toISOString(),
    is_active: false,
  });

/**
 * Supprime définitivement un utilisateur.
 * @param {number} id
 * @returns {Promise<number>} Nombre de lignes supprimées.
 */
export const remove = (id) => db('users').where('id', id).delete();
