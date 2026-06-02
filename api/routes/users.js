/**
 * Routes utilisateurs — /api/users
 * Toutes les routes sont protégées par le middleware JWT (auth).
 */
import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireRole('admin', 'responsable'), ctrl.getAll);
router.get('/:id', requireRole('admin', 'responsable'), ctrl.getById);
router.post('/', requireRole('admin', 'responsable'), ctrl.create);
router.patch('/:id', requireRole('admin'), ctrl.update);
router.delete('/:id/anonymize', requireRole('admin'), ctrl.anonymize);
router.delete('/:id', requireRole('admin', 'responsable'), ctrl.remove);

export default router;
