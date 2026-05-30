import { Router } from 'express';
import * as controller from '../controllers/classes';

const router = Router();

router.get('/', controller.getClasses);
router.get('/:id', controller.getClassById);
router.get('/:id/students', controller.getClassStudents);
router.post('/', controller.createClass);
router.put('/:id', controller.updateClass);
router.delete('/:id', controller.deleteClass);

export default router;
