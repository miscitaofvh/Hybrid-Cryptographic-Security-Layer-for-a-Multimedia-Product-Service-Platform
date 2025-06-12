  import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { sendAnomalyEmail } from '../utils/sendAnomalyEmail.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, sessionId } = decoded;

    // Kiểm tra session tồn tại
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Session invalid or expired' });
    }

    // Kiểm tra IP và User-Agent nếu muốn
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'] || '';

    if (session.ip !== clientIp || session.userAgent !== userAgent) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user) {
        await sendAnomalyEmail(user.email, {
          ip: clientIp,
          userAgent: userAgent,
        });
      }

      console.warn(`[ANOMALY] User ${session.userId} - IP/UA mismatch.`);
    }

    req.user = {
      id: userId,
      sessionId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Middleware phân quyền
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
