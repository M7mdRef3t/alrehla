import { logger } from "@/services/logger";
import { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";

type AuthUser = Record<string, unknown> | null;
type AuthResult = { status: boolean; msg?: string; decoded?: Record<string, unknown> | null };

// Global promise cache to avoid duplicate network requests across multiple blocks
let authPromiseCache: Promise<AxiosResponse<any, any>> | null = null;
let globalAuthUser: AuthUser | undefined = undefined;

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser>(globalAuthUser !== undefined ? globalAuthUser : null);
  const [loading, setLoading] = useState(globalAuthUser === undefined);

  useEffect(() => {
    if (globalAuthUser !== undefined) {
      setUser(globalAuthUser);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        if (!authPromiseCache) {
          authPromiseCache = axios.get("/api/auth?action=verify");
        }
        const response = await authPromiseCache;
        if (response.data.status) {
          globalAuthUser = response.data.decoded;
        } else {
          globalAuthUser = null;
        }
        setUser(globalAuthUser || null);
      } catch (err) {
        globalAuthUser = null;
        setUser(null);
        // Clear cache so it retries later if it was a network failure
        authPromiseCache = null; 
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await axios.post("/api/auth?action=login", {
        email,
        password,
      });
      if (response.data.status) {
        window.location.reload();
      }
      return response.data;
    } catch (err) {
      return { status: false, msg: "Login failed" };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<AuthResult> => {
    try {
      const response = await axios.post("/api/auth?action=signup", {
        email,
        password,
        username,
      });
      if (response.data.status) {
        window.location.reload();
      }
      return response.data;
    } catch (err) {
      return { status: false, msg: "Signup failed" };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth?action=logout");
      window.location.reload();
    } catch (err) {
      logger.error("Logout failed", err);
    }
  };

  return { user, loading, login, signup, logout };
};
