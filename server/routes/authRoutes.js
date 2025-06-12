import express from 'express';
import { register, login, refreshToken, logout, getMe} from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

export default router;
