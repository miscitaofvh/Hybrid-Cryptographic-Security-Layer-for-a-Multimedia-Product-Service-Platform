import API from "@/config/api";
import type { LoginInput, RegisterInput } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

export const login = async ({email, password, otp}: LoginInput) => {
  const res = await API.post("/auth/login", {email, password, otp});
  return res.data;
};

export const register = async (data: RegisterInput) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const getMe = async () => {
  const { accessToken } = useAuth();
  
  const res = await API.get("auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return res.data;
};