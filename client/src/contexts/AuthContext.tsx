import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Athlete, Coach } from "@shared/schema";

interface AuthState {
  authenticated: boolean;
  user: (Athlete | Coach) | null;
  role: "athlete" | "coach" | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  setUserLocally: (user: Athlete | Coach, role: "athlete" | "coach") => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    user: null,
    role: null,
    loading: true,
  });
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [, setLocation] = useLocation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const performLogout = useCallback(async () => {
    clearTimers();
    setShowTimeoutDialog(false);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("currentAthlete");
    localStorage.removeItem("currentCoach");
    setAuth({ authenticated: false, user: null, role: null, loading: false });
    setLocation("/");
  }, [clearTimers, setLocation]);

  const resetTimers = useCallback(() => {
    if (!auth.authenticated) return;
    clearTimers();
    lastActivityRef.current = Date.now();

    warningRef.current = setTimeout(() => {
      setShowTimeoutDialog(true);
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, SESSION_TIMEOUT_MS);
  }, [auth.authenticated, clearTimers, performLogout]);

  const handleActivity = useCallback(() => {
    if (!auth.authenticated) return;
    if (showTimeoutDialog) return;
    const now = Date.now();
    if (now - lastActivityRef.current > 5000) {
      resetTimers();
    }
  }, [auth.authenticated, showTimeoutDialog, resetTimers]);

  useEffect(() => {
    if (!auth.authenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [auth.authenticated, handleActivity]);

  useEffect(() => {
    if (auth.authenticated) {
      resetTimers();
    }
    return clearTimers;
  }, [auth.authenticated, resetTimers, clearTimers]);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/session");
      const data = await res.json();
      if (data.authenticated) {
        setAuth({
          authenticated: true,
          user: data.user,
          role: data.role,
          loading: false,
        });
        if (data.role === "athlete") {
          localStorage.setItem("currentAthlete", JSON.stringify(data.user));
        } else {
          localStorage.setItem("currentCoach", JSON.stringify(data.user));
        }
      } else {
        localStorage.removeItem("currentAthlete");
        localStorage.removeItem("currentCoach");
        setAuth({ authenticated: false, user: null, role: null, loading: false });
      }
    } catch {
      setAuth((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const setUserLocally = useCallback((user: Athlete | Coach, role: "athlete" | "coach") => {
    setAuth({ authenticated: true, user, role, loading: false });
    if (role === "athlete") {
      localStorage.setItem("currentAthlete", JSON.stringify(user));
    } else {
      localStorage.setItem("currentCoach", JSON.stringify(user));
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleStayLoggedIn = useCallback(async () => {
    setShowTimeoutDialog(false);
    await refreshSession();
    resetTimers();
  }, [refreshSession, resetTimers]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        refreshSession,
        logout: performLogout,
        setUserLocally,
      }}
    >
      {children}
      <Dialog open={showTimeoutDialog} onOpenChange={(open) => { if (!open) handleStayLoggedIn(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session Expiring Soon</DialogTitle>
            <DialogDescription>
              You've been inactive for a while. Your session will expire in about 2 minutes for security. Would you like to stay signed in?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={performLogout} data-testid="button-session-logout">
              Sign Out
            </Button>
            <Button onClick={handleStayLoggedIn} data-testid="button-session-stay">
              Stay Signed In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
