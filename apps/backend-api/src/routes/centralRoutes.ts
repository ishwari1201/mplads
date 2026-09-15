import { Router } from 'express';
import { CentralController } from '../controllers/centralController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/rbacMiddleware';

const router = Router();

// Apply JWT Authentication
router.use(authenticateJWT);

// Apply RBAC Authorization (Allows CENTRAL_AUTHORITY, ADMIN, NODAL_OFFICER, and demo roles)
router.use(authorizeRoles('CENTRAL_AUTHORITY', 'ADMIN', 'NODAL_OFFICER', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'MP_MLA'));

router.get('/overview', CentralController.getNationalOverview);
router.get('/states', CentralController.getStates);
router.get('/states/:stateId', CentralController.getStateDetail);
router.get('/risk', CentralController.getNationalRisk);
router.get('/cases', CentralController.getMinistryCases);
router.post('/cases/:id/action', CentralController.performMinistryCaseAction);
router.get('/funds', CentralController.getNationalFunds);
router.get('/contractors', CentralController.getContractorNetwork);
router.post('/ai-assistant', CentralController.askCentralAssistant);

export default router;
