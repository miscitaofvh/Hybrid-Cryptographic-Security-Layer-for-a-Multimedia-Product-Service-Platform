import prisma from '../config/db.js';
import { encapsulate } from '../services/kyberService.js';

/**
 * Nhận publicKey từ client, thực hiện Kyber encapsulate,
 * lưu sharedKey vào session để dùng cho mã hóa stream.
 */
export const receiveClientPublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    const sessionId = req.user?.sessionId;

    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing publicKey' });
    }

    if (!sessionId) {
      return res.status(401).json({ message: 'Unauthorized: missing sessionId' });
    }

    const { ciphertext, sharedKey } = await encapsulate(publicKey);

    await prisma.session.update({
      where: { id: sessionId },
      data: { pqSharedKey: sharedKey },
    });

    return res.status(200).json({
      message: 'Key exchange successful',
      ciphertext,
    });
  } catch (error) {
    console.error('🔐 Error during key exchange:', error);
    return res.status(500).json({ message: 'Key exchange failed' });
  }
};
