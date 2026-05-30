import { Router } from 'express';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth/index';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

router.get('/dashboard', controller.getDashboard);
router.get('/reports', controller.getReports);
router.get('/fees/dashboard', controller.getFeesDashboard);
router.get('/exams/dashboard', controller.getExamsDashboard);

export default router;
