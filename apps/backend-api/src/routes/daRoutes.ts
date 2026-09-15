import { Router } from 'express';
import { DAController } from '../controllers/daController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/rbacMiddleware';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles('DISTRICT_AUTHORITY', 'DA', 'STATE_AUTHORITY', 'STATE', 'CENTRAL_AUTHORITY', 'CENTRAL', 'ADMIN'));

router.get('/overview-metrics', DAController.getOverviewMetrics);
router.get('/priority-queue', DAController.getPriorityQueue);
router.get('/pending-recommendations', DAController.getPendingRecommendations);

router.get('/works/:id/risk-history', DAController.getRiskHistory);
router.get('/works/:id/government-checks', DAController.getGovernmentChecks);
router.get('/works/:id/satellite-verification', DAController.getSatelliteVerification);
router.get('/works/:id/analysis', DAController.getWorkAnalysis);

router.post('/works/:id/pre-sanction-screen', DAController.runPreSanctionScreen);
router.post('/works/:id/sanction', DAController.sanctionProject);
router.post('/sanction-project', DAController.sanctionProject);
router.post('/works/:id/assign-ia', DAController.assignIA);
router.post('/works/:id/request-evidence', DAController.requestEvidence);
router.post('/works/:id/return-correction', DAController.returnForCorrection);
router.get('/works/:id/execution-stats', DAController.getExecutionStats);
router.get('/works/:id/evidence', DAController.getWorkEvidence);

router.post('/cases/:id/action', DAController.performCaseAction);
router.post('/reject-project', DAController.rejectProject);

export default router;
