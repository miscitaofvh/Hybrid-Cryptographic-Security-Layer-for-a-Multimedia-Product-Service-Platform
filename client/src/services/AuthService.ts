import API from "@/config/api";
import type { LoginInput, RegisterInput } from "@/types/auth";

export const login = async ({email, password, otp}: LoginInput) => {
  const res = await API.post("/auth/login", {email, password, otp});
  return res.data;
};

export const register = async (data: RegisterInput) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};