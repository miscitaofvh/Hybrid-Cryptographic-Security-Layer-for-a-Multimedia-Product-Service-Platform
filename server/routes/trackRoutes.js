import { Router } from 'express';
import { getTracks, getTrackById, streamTrack } from '../controllers/trackController.js';
import { auth } from '../middleware/auth.js';
import { attachSharedKey } from '../middleware/attachSharedKey.js';

const router = Router();

router.get('/get-tracks', auth, getTracks);

router.get('/:id', auth, getTrackById);

router.get('/:id/stream', auth, attachSharedKey, streamTrack);

export default router;
