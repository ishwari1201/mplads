import { Router } from 'express';
import { PublicController } from '../controllers/publicController';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.get('/transparency-map', PublicController.getTransparencyMapData);
router.post('/report-fraud', upload.single('proof'), PublicController.reportFraud);

export default router;
