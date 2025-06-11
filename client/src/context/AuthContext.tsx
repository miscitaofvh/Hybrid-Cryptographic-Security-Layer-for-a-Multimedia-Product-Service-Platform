import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import API from "@/config/api";
import type { AuthContextType } from "@/types/authContext";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.post("/auth/refresh")
      .then(res => setAccessToken(res.data.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await API.post("/auth/logout", {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setAccessToken(null);
    }
  };


  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
