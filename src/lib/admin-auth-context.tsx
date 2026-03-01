"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { adminAuthAPI } from "./api";

/* ---------------- TYPES ---------------- */

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

/* ---------------- CONTEXT ---------------- */

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

/* ---------------- PROVIDER ---------------- */

export const AdminAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  /* ✅ Load admin session on refresh */
  useEffect(() => {
    const token = adminAuthAPI.getToken();
    const storedAdmin = adminAuthAPI.getCurrentAdmin();

    if (token && storedAdmin) {
      setAdmin(storedAdmin);
      setIsAuthenticated(true);
    }
  }, []);

  /* ✅ Login */
  const login = useCallback(
    async (data: { email: string; password: string }) => {
      const res = await adminAuthAPI.login(data);

      setAdmin(res.admin);
      setIsAuthenticated(true);
    },
    []
  );

  /* ✅ Logout */
  const logout = useCallback(() => {
    adminAuthAPI.logout();
    setAdmin(null);
    setIsAuthenticated(false);
    router.replace("/login");
    router.refresh();
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider"
    );
  }

  return ctx;
};
