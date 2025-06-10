import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import { generateOtp } from "../utils/generateOtp.js";
import crypto from 'crypto';

// Security constants
const MAX_PASSWORD_ATTEMPTS = 5;
const PASSWORD_ATTEMPT_WINDOW = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_REQUEST_LIMIT = 3;
const OTP_REQUEST_WINDOW = 10 * 60 * 1000; 
const OTP_EXPIRE_TIME = 3 * 60 * 1000; 
const ACCESS_TOKEN_EXPIRES = 15 * 60 * 1000; 
const REFRESH_TOKEN_EXPIRES = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256')
    .update(token + process.env.REFRESH_TOKEN_PEPPER)
    .digest('hex');
}

// Utility to generate strong refresh token
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex'); 
}

export const register = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, username },
    });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password, otp } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const now = new Date();
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // Password brute-force protection
  if (user.passwordLastAttempt && now - user.passwordLastAttempt > PASSWORD_ATTEMPT_WINDOW) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordFailCount: 0 },
    });
    user.passwordFailCount = 0;
  }

  if (user.passwordFailCount >= MAX_PASSWORD_ATTEMPTS) {
    return res.status(429).json({ message: "Too many wrong password attempts. Please try again later." });
  }

  const validPw = await bcrypt.compare(password, user.password);
  if (!validPw) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordFailCount: { increment: 1 },
        passwordLastAttempt: now,
      }
    });
    return res.status(401).json({ message: "Invalid credentials" });
  }  
    
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordFailCount: 0, passwordLastAttempt: null }
  });

  // MFA/OTP
  if (user.mfaEnabled) {
    // Giới hạn gửi lại OTP
    if (!otp) {
      if (!user.otpRequestStart || new Date() - user.otpRequestStart > OTP_REQUEST_WINDOW
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { otpRequestCount: 1, otpRequestStart: new Date() }
        });
      } else {
        if (user.otpRequestCount >= OTP_REQUEST_LIMIT) {
          return res.status(429).json({ message: "You have requested OTP too many times. Please try again later." });
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { otpRequestCount: { increment: 1 } }
        });
      }

      const generatedOtp = generateOtp();
      const expires = new Date(Date.now() + OTP_EXPIRE_TIME);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: generatedOtp,
          otpExpiresAt: expires
        },
      });

      await sendOtpEmail(user.email, generatedOtp);
      return res
        .status(401)
        .json({ message: "MFA code sent to your email. Please enter it." });
    }

    // Giới hạn nhập sai OTP
    if (user.otpLastAttempt && new Date() - user.otpLastAttempt > OTP_REQUEST_WINDOW) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpFailCount: 0 }
      });
      user.otpFailCount = 0;
    }

    if (user.otpFailCount >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many invalid OTP attempts. Please try again later." });
    }

    // Kiểm tra OTP đúng/sai
    if (user.otpCode !== otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpFailCount: { increment: 1 },
          otpLastAttempt: new Date(),
        },
      });
      return res.status(401).json({ message: "Invalid or expired OTP code." });
    }

    // Nếu đúng, reset OTP & đếm lỗi liên quan OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        otpFailCount: 0,
        otpLastAttempt: null,
        otpRequestCount: 0,
        otpRequestStart: null,
      },
    });
  }

  const refreshToken = generateSecureToken();
  const hashedRefreshToken = hashToken(refreshToken);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashedRefreshToken,
      pqSharedKey: null,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
      revoked: false,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES),
    },
  });

  const accessToken = jwt.sign(
    {
      userId: user.id,
      sessionId: session.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES / 1000 + 's' }
  );

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false, // Set to true in production
    sameSite: 'Strict',
    maxAge: REFRESH_TOKEN_EXPIRES,
  });

  res.status(200).json({
    message: "Login successful",
    accessToken: accessToken,
  });
};

export const refreshToken = async (req, res) => {
  const rawToken = req.cookies?.refresh_token;
  if (!rawToken) return res.status(401).json({ message: 'No refresh token' });

  const hashed = hashToken(rawToken);

  const session = await prisma.session.findFirst({
    where: {
      refreshToken: hashed,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }

  const accessToken = jwt.sign(
    {
      userId: session.user.id,
      sessionId: session.id,
      role: session.user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES / 1000 + 's' }
  );

  res.status(200).json({
    message: 'Access token refreshed',
    accessToken: accessToken,
  });
};

export const logout = async (req, res) => {
  const sessionId = req.user.sessionId;
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revoked: true },
    });
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const setPQKey = async (req, res) => {
  const { pqPublicKey } = req.body;
  const sessionId = req.user.sessionId;

  if (!pqPublicKey) {
    return res.status(400).json({ message: 'Missing pqPublicKey' });
  }

  // 1. Server tạo Kyber KEM key
  const { sharedKey, ciphertext } = simulateKyberKEM(pqPublicKey); // Bạn cần thay bằng lib thực tế

  // 2. Lưu sharedKey vào session
  await prisma.session.update({
    where: { id: sessionId },
    data: { pqSharedKey: sharedKey },
  });

  // 3. Gửi ciphertext cho client để giải mã
  res.status(200).json({
    message: 'PQ shared key established',
    ciphertext: ciphertext,
  });
};
