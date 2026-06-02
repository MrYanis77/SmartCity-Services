/**
 * Contrôleur interventions – couche HTTP.
 */
import * as interventionService from '../services/interventionService.js';
import { resolveUserId } from '../middleware/auth.js';
import {
  buildInterventionQueryFilters,
  assertCanWriteIntervention,
  assertCanUpdateIntervention,
  assertCanDeleteIntervention,
} from '../middleware/scopeData.js';

export const getAll = async (req, res) => {
  try {
    const filters = buildInterventionQueryFilters(req, req.query);
    if (filters === null) {
      return res.json([]);
    }
    res.json(await interventionService.getAllInterventions(filters));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await interventionService.getInterventionById(req.params.id);
    const role = req.user?.role;
    const userId = resolveUserId(req);
    if (role === 'agent' && Number(item.agent_id) !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (role === 'citoyen') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    res.json(item);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    assertCanWriteIntervention(req);
    const item = await interventionService.createIntervention(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    await assertCanUpdateIntervention(req, req.params.id, req.body);
    res.json(await interventionService.updateIntervention(req.params.id, req.body));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await assertCanDeleteIntervention(req);
    await interventionService.deleteIntervention(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
