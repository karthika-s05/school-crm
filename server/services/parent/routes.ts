import { Router } from 'express';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth/index';

const router = Router();

router.use(authenticate);
router.use(authorize('parent', 'admin', 'super_admin'));

router.get('/dashboard', controller.getParentDashboard);
router.get('/children', controller.getChildren);
router.get('/children/:studentId/attendance', controller.getChildAttendance);
router.get('/children/:studentId/fees', controller.getChildFees);
router.post('/fees/:feeId/pay', controller.payFee);
router.get('/children/:studentId/results', controller.getChildResults);
router.get('/children/:studentId/timetable', controller.getChildTimetable);
router.get('/notifications', controller.getNotifications);

export default router;
