import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import API from "@/config/api";
import type { AuthContextType, UserInfoType } from "@/types/authContext";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfoType | null>(null); // Thêm state user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.post("/auth/refresh")
      .then(res => setAccessToken(res.data.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  const getMe = useCallback(async (token?: string) => {
    try {
      const res = await API.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token || accessToken}`,
        }
      });
      setUser(res.data); 
      return res.data;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && !user) {
      getMe();
    }
  }, [accessToken, user, getMe]);

  const logout = async () => {
    try {
      await API.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      accessToken,
      setAccessToken,
      user,           
      setUser,        
      getMe,          
      loading,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
