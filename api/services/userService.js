/**
 * Service utilisateurs — couche logique métier.
 *
 * Orchestre les opérations sur les utilisateurs : hachage des mots de passe,
 * vérification des identifiants, gestion du refresh token et anonymisation RGPD.
 *
 * Toutes les interactions avec la base de données passent par `userRepository`.
 */
import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/userRepository.js';
import * as incidentRepo from '../repositories/incidentRepository.js';
import db from '../../db/index.js';

/** Nombre de rounds bcrypt pour le hachage des mots de passe */
const SALT_ROUNDS = 12;

/**
 * Retourne la liste des utilisateurs avec filtre optionnel par rôle.
 * @param {{ role?: string }} filters
 * @returns {Promise<object[]>}
 */
export const getAllUsers = (filters = {}) => userRepo.findAll(filters);

/**
 * Retourne un utilisateur par son identifiant.
 * @param {number} id
 * @returns {Promise<object>}
 * @throws {Error} Si l'utilisateur n'existe pas.
 */
export const getUserById = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });
  return user;
};

/**
 * Crée un nouvel utilisateur après hachage du mot de passe.
 * Enregistre la date de consentement RGPD si fournie.
 *
 * @param {{ email: string, password: string, role: string, full_name: string, phone?: string, consent?: boolean }} data
 * @returns {Promise<object>} Utilisateur créé (sans password_hash).
 */
export const createUser = async ({ email, password, role, full_name, phone, consent }) => {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const consent_at = consent ? new Date().toISOString() : null;
  return userRepo.create({ email, password_hash, role, full_name, phone, consent_at });
};

/**
 * Met à jour les champs non sensibles d'un utilisateur.
 * @param {number} id
 * @param {object} updates - Champs à modifier (sans password_hash).
 * @returns {Promise<object>}
 */
export const updateUser = async (id, updates) => {
  // Interdire la modification du hash via cette méthode
  const { password_hash, ...safeUpdates } = updates;
  const user = await userRepo.update(id, safeUpdates);
  if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });
  return user;
};

/**
 * Vérifie les identifiants et retourne l'utilisateur si valides.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Utilisateur authentifié.
 * @throws {Error} Si les identifiants sont incorrects.
 */
export const verifyCredentials = async (email, password) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw Object.assign(new Error('Identifiants incorrects'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Identifiants incorrects'), { status: 401 });

  // Ne pas retourner le hash dans la réponse
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

/**
 * Enregistre un refresh token haché pour un utilisateur (après login).
 * @param {number} id
 * @param {string} plainToken - Token en clair à hacher avant stockage.
 */
export const saveRefreshToken = async (id, plainToken) => {
  const hashed = await bcrypt.hash(plainToken, SALT_ROUNDS);
  await userRepo.setRefreshToken(id, hashed);
};

/**
 * Vérifie un refresh token fourni par le client contre le hash stocké.
 * @param {number} id
 * @param {string} plainToken
 * @returns {Promise<boolean>}
 */
export const verifyRefreshToken = async (id, plainToken) => {
  // Récupère directement le refresh_token haché (non exposé par PUBLIC_FIELDS)
  const row = await db('users').select('refresh_token').where('id', id).first();
  if (!row?.refresh_token) return false;
  return bcrypt.compare(plainToken, row.refresh_token);
};

/**
 * Révoque le refresh token d'un utilisateur (déconnexion).
 * @param {number} id
 */
export const revokeRefreshToken = (id) => userRepo.setRefreshToken(id, null);

/**
 * Anonymise un compte citoyen (droit à l'oubli RGPD).
 * Remplace les données personnelles et anonymise les incidents associés.
 * @param {number} id
 */
export const anonymizeUser = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });

  // Anonymiser les incidents liés avant de modifier l'utilisateur
  await incidentRepo.anonymizeByCitizen(id);

  // Remplacer les données personnelles
  await userRepo.anonymize(id);
};

/**
 * Supprime définitivement un utilisateur.
 * Préférer `anonymizeUser` pour respecter le RGPD.
 * @param {number} id
 */
export const deleteUser = async (id) => {
  const deleted = await userRepo.remove(id);
  if (!deleted) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });
};
