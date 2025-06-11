import { AuthProvider } from "@/context/AuthContext";
import { KeyProvider } from "./context/KeyContext";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import RegisterPage from "@/pages/RegisterPage"
import LoginPage from "@/pages/LoginPage"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function App() {
  return (
    <AuthProvider>
      <KeyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </KeyProvider>
    </AuthProvider>
  )
}