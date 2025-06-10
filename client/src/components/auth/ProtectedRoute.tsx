import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { accessToken, loading } = useAuth();
  
  if (loading) return null;
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}