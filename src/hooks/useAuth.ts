import { logger } from "@/services/logger";
import { useState, useEffect } from "react";
import axios from "axios";

type AuthUser = Record<string, unknown> | null;
type AuthResult = { status: boolean; msg?: string; decoded?: Record<string, unknown> | null };

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/api/auth?action=verify");
        if (response.data.status) {
          setUser(response.data.decoded);
        } else {
          setUser(null);
        }
        setLoading(false);
      } catch (err) {
        setUser(null);
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
