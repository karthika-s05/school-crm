import { Router } from 'express';
import * as controller from '../controllers/teachers';

const router = Router();

router.get('/', controller.getTeachers);
router.get('/:id', controller.getTeacherById);
router.post('/', controller.createTeacher);
router.put('/:id', controller.updateTeacher);
router.delete('/:id', controller.deleteTeacher);

export default router;
