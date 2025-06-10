import { AuthProvider } from "@/context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import RegisterPage from "@/pages/RegisterPage"
import LoginPage from "@/pages/LoginPage"
//import ExchangePage from "@/pages/ExchangePage"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* <Route
            path="/exchange"
            element={
              <ProtectedRoute>
                <ExchangePage />
              </ProtectedRoute>
            }
          /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}