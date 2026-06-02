/**
 * Contrôleur utilisateurs – couche HTTP.
 *
 * Mince couche Express qui valide les entrées HTTP, délègue au service
 * et formate la réponse. Toute la logique métier est dans `userService`.
 *
 * Routes associées : /api/users
 */
import * as userService from '../services/userService.js';

/** Récupère les utilisateurs (avec filtre optionnel ?role=). */
export const getAll = async (req, res) => {
  try {
    res.json(await userService.getAllUsers(req.query));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** Récupère un utilisateur par son identifiant. */
export const getById = async (req, res) => {
  try {
    res.json(await userService.getUserById(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * Crée un nouvel utilisateur.
 * Attend : { email, password, role, full_name, phone?, consent }
 */
export const create = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

/** Met à jour les champs non sensibles d'un utilisateur. */
export const update = async (req, res) => {
  try {
    res.json(await userService.updateUser(req.params.id, req.body));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

/**
 * Anonymise un compte utilisateur (droit à l'oubli RGPD).
 * Route : DELETE /api/users/:id/anonymize
 */
export const anonymize = async (req, res) => {
  try {
    await userService.anonymizeUser(req.params.id);
    res.json({ success: true, message: 'Compte anonymisé conformément au RGPD.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * Supprime définitivement un utilisateur.
 * Préférer la route d'anonymisation pour respecter le RGPD.
 */
export const remove = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
