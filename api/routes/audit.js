import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as auditController from '../controllers/auditController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireRole('responsable', 'admin'), auditController.getAll);
router.post('/', requireRole('admin'), auditController.create);

export default router;
