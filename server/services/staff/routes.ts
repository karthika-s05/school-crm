import { Router } from 'express';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth/index';

const router = Router();

router.use(authenticate);
router.use(authorize('staff', 'admin', 'super_admin'));

router.get('/dashboard', controller.getStaffDashboard);
router.get('/my-classes', controller.getMyClasses);
router.get('/classes/:classId/students', controller.getClassStudents);
router.post('/attendance/bulk', controller.markAttendanceMultiple);
router.get('/attendance/history/:studentId', controller.getStudentAttendanceHistory);
router.get('/timetable', controller.getMyTimetable);

export default router;
