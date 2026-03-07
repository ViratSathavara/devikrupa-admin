"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthAPI } from "./api";

export type Admin = {
  id: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
};

type AdminAuthContextType = {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const getInitialAuthState = (): {
  admin: Admin | null;
  isAuthenticated: boolean;
} => {
  const token = adminAuthAPI.getToken();
  const storedAdmin = adminAuthAPI.getCurrentAdmin();

  if (token && storedAdmin) {
    return {
      admin: storedAdmin,
      isAuthenticated: true,
    };
  }

  return {
    admin: null,
    isAuthenticated: false,
  };
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [initialAuthState] = useState(getInitialAuthState);
  const [admin, setAdmin] = useState<Admin | null>(initialAuthState.admin);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialAuthState.isAuthenticated,
  );
  const router = useRouter();

  const login = useCallback(async (data: { email: string; password: string }) => {
    const response = await adminAuthAPI.login(data);
    setAdmin(response.admin);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    adminAuthAPI.logout();
    setAdmin(null);
    setIsAuthenticated(false);
    router.replace("/login");
    router.refresh();
  }, [router]);

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return context;
};
