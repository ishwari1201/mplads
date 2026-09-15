import { Router } from 'express';
import { StateController } from '../controllers/stateController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/rbacMiddleware';

const router = Router();

// Apply JWT Authentication
router.use(authenticateJWT);

// Apply RBAC Authorization (Allows STATE_AUTHORITY, ADMIN, NODAL_OFFICER, and demo roles)
router.use(authorizeRoles('STATE_AUTHORITY', 'ADMIN', 'NODAL_OFFICER', 'DISTRICT_AUTHORITY', 'MP_MLA'));

router.get('/overview', StateController.getStateOverview);
router.get('/districts', StateController.getDistricts);
router.get('/districts/:districtId', StateController.getDistrictDetail);
router.get('/works', StateController.getStateWorks);
router.get('/works/:id', StateController.getWorkDetail);
router.get('/cases', StateController.getEscalatedCases);
router.post('/cases/:id/action', StateController.performCaseAction);
router.get('/contractors', StateController.getContractorAnalytics);
router.post('/ai-assistant', StateController.askStateAssistant);

export default router;
