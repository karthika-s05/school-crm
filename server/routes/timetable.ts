import { Router } from 'express';
import * as controller from '../controllers/timetable';

const router = Router();

router.get('/', controller.getTimetable);
router.get('/class/:classId', controller.getClassTimetable);
router.post('/', controller.addTimetableEntry);
router.put('/:id', controller.updateTimetableEntry);
router.delete('/:id', controller.deleteTimetableEntry);

export default router;
