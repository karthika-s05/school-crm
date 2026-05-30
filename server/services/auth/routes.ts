import { Router } from 'express';
import * as controller from './controller';

const router = Router();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/profile/:userId', controller.getProfile);
router.put('/profile/:userId', controller.updateProfile);
router.put('/password/:userId', controller.changePassword);
router.get('/users', controller.getUsers);
router.put('/users/:userId/status', controller.updateUserStatus);

export default router;
