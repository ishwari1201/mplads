import { Router } from 'express';
import { CitizenController } from '../controllers/citizenController';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// System configuration for citizen portal
router.get('/config', CitizenController.getConfig);

// Geographic area hierarchy dropdown routes
router.get('/geographies/states', CitizenController.getStates);
router.get('/geographies/districts', CitizenController.getDistricts);
router.get('/geographies/constituencies', CitizenController.getConstituencies);

// Public works search & PostGIS nearby routes
router.get('/works', CitizenController.getPublicWorks);
router.get('/works/nearby', CitizenController.getNearbyWorks);
router.get('/works/:id', CitizenController.getPublicWorkDetail);

// Citizen ground-verification report submission
router.post('/reports', upload.single('photo'), CitizenController.submitCitizenReport);

// Citizen reports lookup
router.get('/reports', CitizenController.getCitizenReports);
router.get('/reports/:id', CitizenController.getCitizenReportById);

export default router;
