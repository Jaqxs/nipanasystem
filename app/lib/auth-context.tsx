"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import api from "./api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales_ops";
  token: string;
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "gbms.auth.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.token) {
          setUser(u);
        } else {
          console.warn("[Auth] Stale or invalid session found, clearing...");
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error("[Auth] Error restoring session", err);
    }
    setReady(true);
    
    // Auto-login for configuration convenience if in development
    if (process.env.NODE_ENV === "development" && !localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => {
        console.log("[Auth] Attempting auto-login for development...");
        login("j.assey@nipana.tz", "demo");
      }, 1000);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const u: AuthUser = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        token: data.token
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return { ok: true };
    } catch (err: any) {
      return { 
        ok: false, 
        error: err.response?.data?.message || "Login failed. Check your connection." 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };


  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, ready, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
