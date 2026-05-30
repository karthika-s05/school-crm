import { Router } from 'express';
import * as controller from '../controllers/students';

const router = Router();

router.get('/', controller.getStudents);
router.get('/:id', controller.getStudentById);
router.post('/', controller.createStudent);
router.put('/:id', controller.updateStudent);
router.delete('/:id', controller.deleteStudent);

export default router;
