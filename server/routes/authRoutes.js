import express from 'express';
import { register, login, refreshToken, logout, setPQKey } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);
router.post('/pq-key', auth, authLimiter, setPQKey);

export default router;
