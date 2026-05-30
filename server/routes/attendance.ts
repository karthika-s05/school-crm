import { Router } from 'express';
import * as controller from '../controllers/attendance';

const router = Router();

router.get('/', controller.getAttendance);
router.get('/stats', controller.getAttendanceStats);
router.post('/', controller.recordAttendance);
router.post('/bulk', controller.bulkRecordAttendance);

export default router;
