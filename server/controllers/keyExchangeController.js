import prisma from '../config/db.js';
import crypto from 'crypto';
import { encapsulate } from '../services/kyberService.js';

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

    const sharedKeyHex = crypto
      .createHash('sha512')
      .update(Buffer.from(sharedKey, 'base64'))
      .digest('hex');

    await prisma.session.update({
      where: { id: sessionId },
      data: { pqSharedKey: sharedKeyHex },
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
