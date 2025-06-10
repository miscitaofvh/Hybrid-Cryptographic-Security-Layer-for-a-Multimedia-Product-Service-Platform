import { useState } from "react";
import { register } from "@/services/AuthService";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      navigate("/");
    }
  }, [accessToken]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(form);
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] via-[#151515] to-black flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] px-10 py-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-white text-3xl font-bold mb-6 text-center tracking-tight">
          Register
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-[#2c2f33] text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.username}
            onChange={handleChange}
            required
          />
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
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-[#2c2f33] text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full mt-6 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg shadow-md transition duration-300"
        >
          Register
        </button>

        <p className="text-sm text-gray-400 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-green-400 hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
