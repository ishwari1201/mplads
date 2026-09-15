import { Router } from 'express';
import { MPController } from '../controllers/mpController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/rbacMiddleware';

const router = Router();

// Apply JWT Authentication Middleware to all MP endpoints
router.use(authenticateJWT);

// Apply RBAC role authorization (allows MP_MLA and MP)
router.use(authorizeRoles('MP_MLA', 'MP'));

router.get('/dashboard-stats', MPController.getDashboardStats);
router.get('/recommendations', MPController.getRecommendations);
router.post('/recommendations', MPController.submitRecommendation);
router.post('/check-duplicate', MPController.checkDuplicate);

export default router;
