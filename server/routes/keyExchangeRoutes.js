import express from 'express';
import { receiveClientPublicKey } from '../controllers/keyExchangeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/key-exchange
 * - Yêu cầu: user đã đăng nhập (có access token hợp lệ)
 * - Body: { publicKey: string (base64) }
 * - Phản hồi: { ciphertext: string (base64) }
 */
router.post('/', auth, receiveClientPublicKey);

export default router;
