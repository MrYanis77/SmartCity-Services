/**
 * Contrôleur incidents – couche HTTP.
 */
import * as incidentService from '../services/incidentService.js';
import { resolveUserId } from '../middleware/auth.js';
import { savePhotoFromBase64 } from '../lib/photos.js';
import { geocodeAddress } from '../lib/geocode.js';
import {
  buildIncidentQueryFilters,
  assertCanCreateIncident,
  assertCanReadIncident,
  assertCanUpdateIncident,
} from '../middleware/scopeData.js';

const buildCreatePayload = async (body, citizenId) => {
  let photo_path = body.photo_path ?? null;
  if (body.photo_data) {
    photo_path = savePhotoFromBase64(body.photo_data, body.photo_filename, body.photo_mime);
  }

  let latitude = body.latitude != null ? Number(body.latitude) : 0;
  let longitude = body.longitude != null ? Number(body.longitude) : 0;
  if (latitude === 0 && longitude === 0 && body.address) {
    const coords = await geocodeAddress(body.address);
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    }
  }

  return {
    category: body.category,
    subcategory: body.subcategory ?? null,
    priority: body.priority ?? 'moyen',
    description: body.description ?? null,
    address: body.address ?? null,
    photo_path,
    latitude,
    longitude,
    citizen_id: citizenId,
  };
};

export const getAll = async (req, res) => {
  try {
    const filters = buildIncidentQueryFilters(req, req.query);
    res.json(await incidentService.getAllIncidents(filters));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    await assertCanReadIncident(req, incident);
    res.json(incident);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    assertCanCreateIncident(req);
    const citizenId = resolveUserId(req);
    if (!citizenId) {
      return res.status(401).json({ error: 'Session invalide — reconnectez-vous.', code: 'INVALID_SESSION' });
    }
    const incident = await incidentService.createIncident(
      await buildCreatePayload(req.body, citizenId)
    );
    res.status(201).json(incident);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    await assertCanUpdateIncident(req, req.params.id);
    const actorId = resolveUserId(req);
    res.json(await incidentService.updateIncident(req.params.id, req.body, actorId));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'responsable') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    await incidentService.deleteIncident(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
