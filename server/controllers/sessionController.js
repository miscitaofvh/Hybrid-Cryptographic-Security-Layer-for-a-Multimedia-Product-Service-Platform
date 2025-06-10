import { kyber } from 'kyber-crystals';
import prisma from '../config/db.js';
import { storeSharedKey } from '../utils/kms.js'; // KMS encrypt utility

export const setPQKey = async (req, res) => {
  const { pqPublicKey } = req.body;
  const sessionId = req.user.sessionId;
  if (!pqPublicKey) return res.status(400).json({ message: 'Missing pqPublicKey' });

  try {
    const clientPk = Buffer.from(pqPublicKey, 'base64');
    const { cyphertext, secret } = await kyber.encrypt(clientPk);

    const encryptedKey = await storeSharedKey(sessionId, secret.toString('base64'));

    await prisma.session.update({
      where: { id: sessionId },
      data: { pqSharedKey: encryptedKey },
    });

    res.status(200).json({
      message: 'PQ shared key established',
      ciphertext: Buffer.from(cyphertext).toString('base64'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to establish PQ key' });
  }
};
