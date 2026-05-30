import { Router } from 'express';
import * as controller from '../controllers/exams';

const router = Router();

router.get('/', controller.getExams);
router.get('/:id', controller.getExamById);
router.post('/', controller.createExam);
router.put('/:id', controller.updateExam);
router.delete('/:id', controller.deleteExam);
router.get('/results', controller.getExamResults);
router.post('/results', controller.recordExamResult);

export default router;
