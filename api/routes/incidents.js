import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as incidentController from '../controllers/incidentController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', incidentController.getAll);
router.get('/:id', incidentController.getById);
router.post('/', incidentController.create);
router.patch('/:id', incidentController.update);
router.delete('/:id', incidentController.remove);

export default router;
