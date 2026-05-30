import { Router } from 'express';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth/index';

const router = Router();

router.use(authenticate);
router.use(authorize('super_admin'));

router.get('/dashboard', controller.getSystemDashboard);
router.get('/users', controller.getAllUsers);
router.post('/users', controller.createUser);
router.put('/users/:userId', controller.updateUserRole);
router.delete('/users/:userId', controller.deleteUser);
router.put('/users/:userId/password', controller.resetUserPassword);
router.get('/permissions', controller.getPermissions);
router.put('/permissions/:permissionId', controller.updatePermission);

export default router;
