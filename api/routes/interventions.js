import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as interventionController from '../controllers/interventionController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', interventionController.getAll);
router.get('/:id', interventionController.getById);
router.post('/', requireRole('responsable'), interventionController.create);
router.patch('/:id', requireRole('responsable', 'agent'), interventionController.update);
router.delete('/:id', requireRole('responsable'), interventionController.remove);

export default router;
