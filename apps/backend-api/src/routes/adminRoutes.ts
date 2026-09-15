import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/risk-matrix', AdminController.getRiskMatrix);
router.get('/shap-explainer/:recommendation_id', AdminController.getShapExplainerCard);
router.get('/national-stats', AdminController.getNationalStats);

export default router;
