import { Router } from 'express';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth/index';

const router = Router();

router.use(authenticate);
router.use(authorize('student', 'admin', 'super_admin'));

router.get('/dashboard', controller.getStudentDashboard);
router.get('/profile', controller.getMyProfile);
router.get('/attendance', controller.getMyAttendanceHistory);
router.get('/fees', controller.getMyFees);
router.get('/results', controller.getMyResults);
router.get('/timetable', controller.getMyTimetable);
router.get('/library', controller.getLibraryBooks);
router.get('/notifications', controller.getMyNotifications);

export default router;
