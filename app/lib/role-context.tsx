"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Role = "admin" | "sales_ops";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  isAdmin: boolean;
}

const Ctx = createContext<RoleCtx | null>(null);

import { useAuth } from "./auth-context";

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>("admin");

  useEffect(() => {
    if (user?.role) setRole(user.role);
  }, [user]);

  return (
    <Ctx.Provider value={{ role, setRole, isAdmin: role === "admin" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRole must be used within RoleProvider");
  return c;
}
