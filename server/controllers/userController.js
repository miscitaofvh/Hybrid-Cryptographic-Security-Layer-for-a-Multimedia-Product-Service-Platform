import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

// Lấy thông tin cá nhân
export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }, // bạn nên dùng req.user.id thay vì req.user.userId cho nhất quán
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isArtist: true,
      mfaEnabled: true,
      createdAt: true
    }
  });
  res.json({ user });
};

// Cập nhật thông tin cá nhân
export const updateProfile = async (req, res) => {
  const { username } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { username }
  });
  res.json({ message: "Profile updated", username: user.username });
};

// Đổi mật khẩu
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return res.status(400).json({ message: "Old password incorrect" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed }
  });

  res.json({ message: "Password changed" });
};

// Bật MFA: bật chế độ OTP qua email
export const enableMFA = async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      mfaEnabled: true,
      otpRequestCount: 0,
      otpFailCount: 0,
      otpCode: null,
      otpExpiresAt: null,
      otpRequestStart: null,
      otpLastAttempt: null,
    }
  });
  res.json({ message: "Email-based MFA enabled" });
};

// Tắt MFA
export const disableMFA = async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      mfaEnabled: false,
      otpCode: null,
      otpExpiresAt: null,
      otpFailCount: 0,
      otpLastAttempt: null,
      otpRequestCount: 0,
      otpRequestStart: null,
    }
  });
  res.json({ message: "MFA disabled" });
};

// Xem lịch sử login/session cá nhân
export const getSessions = async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      createdAt: true,
      ip: true,
      userAgent: true,
      revoked: true,
      expiresAt: true
    }
  });
  res.json({ sessions });
};

// (Admin) Xem tất cả user
export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      mfaEnabled: true,
      createdAt: true
    }
  });
  res.json({ users });
};
