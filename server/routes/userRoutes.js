import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  enableMFA,
  disableMFA,
  getSessions,
  getAllUsers
} from '../controllers/userController.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/change-password', auth, changePassword);
router.post('/enable-mfa', auth, enableMFA);
router.post('/disable-mfa', auth, disableMFA);
router.get('/sessions', auth, getSessions);
router.get('/all-users', auth, requireRole('admin'), getAllUsers);

export default router;
