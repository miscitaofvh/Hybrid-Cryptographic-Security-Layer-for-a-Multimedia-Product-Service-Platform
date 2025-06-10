import { Router } from 'express';
import { getTracks } from '../controllers/trackController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/get-tracks', auth, getTracks);

export default router;