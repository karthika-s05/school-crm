import { Router } from 'express';
import * as controller from '../controllers/fees';

const router = Router();

router.get('/', controller.getFees);
router.get('/stats', controller.getFeeStats);
router.get('/:id', controller.getFeeById);
router.post('/', controller.createFee);
router.put('/:id', controller.updateFee);

export default router;
