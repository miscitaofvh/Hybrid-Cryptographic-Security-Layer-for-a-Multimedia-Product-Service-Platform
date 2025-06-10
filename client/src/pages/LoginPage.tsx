import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/services/AuthService";
import { useAuth } from "@/context/AuthContext";
import type { LoginInput } from "@/types/auth";
import { useEffect } from "react";

export default function LoginPage() {
  const [form, setForm] = useState<LoginInput>({
    email: "",
    password: "",
    otp: "",
  });
  
  const {accessToken, setAccessToken } = useAuth();
  const [step, setStep] = useState<"login" | "mfa">("login");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      navigate("/");
    }
  }, [accessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { accessToken } = await login(form);
      setAccessToken(accessToken);
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed";
      if (msg.includes("MFA")) setStep("mfa");
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] via-[#151515] to-black flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] px-10 py-8 rounded-2xl shadow-xl w-full max-w-md"
        autoComplete="off"
      >
        <h2 className="text-white text-3xl font-bold mb-6 text-center tracking-tight">
          Login
        </h2>

        <div className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-[#2c2f33] text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-[#2c2f33] text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.password}
            onChange={handleChange}
            required
          />
          {step === "mfa" && (
            <input
              type="text"
              name="otp"
              placeholder="OTP Code"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-[#2c2f33] text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
              value={form.otp}
              onChange={handleChange}
              required
            />
          )}
        </div>

        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full mt-6 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg shadow-md transition duration-300"
        >
          {step === "mfa" ? "Verify OTP" : "Login"}
        </button>

        <p className="text-sm text-gray-400 mt-4 text-center">
          Don't have an account?{" "}
          <a href="/register" className="text-green-400 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
