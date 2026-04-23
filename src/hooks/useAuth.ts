import { useAuthState } from "@/domains/auth/store/auth.store";
import { signInWithEmail, signUpWithEmail, signOut } from "@/services/authService";
import { logger } from "@/services/logger";

type AuthResult = { status: boolean; msg?: string; decoded?: Record<string, unknown> | null };

export const useAuth = () => {
  // Pull from our global Zustand store
  const user = useAuthState((s) => s.user);
  const status = useAuthState((s) => s.status);
  const loading = status === "loading";

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) return { status: false, msg: error.message };
      return { status: true };
    } catch (err) {
      return { status: false, msg: "Login failed" };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<AuthResult> => {
    try {
      const { error } = await signUpWithEmail(email, password);
      if (error) return { status: false, msg: error.message };
      return { status: true };
    } catch (err) {
      return { status: false, msg: "Signup failed" };
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      logger.error("Logout failed", err);
    }
  };

  return { user, loading, login, signup, logout };
};
