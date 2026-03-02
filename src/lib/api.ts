import axios from "axios";
import { showApiError } from "./toast";

const LOCAL_API_BASE_URL = "http://localhost:4000/api";
const PRODUCTION_API_BASE_URL = "https://api.devikrupaelectricals.in/api";

const normalizeApiBaseUrl = (value?: string): string | null => {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const inferRuntimeApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    return isLocalhost ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
  }

  return process.env.NODE_ENV === "development"
    ? LOCAL_API_BASE_URL
    : PRODUCTION_API_BASE_URL;
};

const API_BASE_URL =
  normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL) ?? inferRuntimeApiBaseUrl();

const isMutationMethod = (method?: string): boolean =>
  ["post", "put", "patch", "delete"].includes((method ?? "get").toLowerCase());

const shouldShowGlobalErrorToast = (error: any): boolean => {
  const config = (error?.config as any) ?? {};
  if (Boolean(config.skipErrorToast)) {
    return false;
  }

  return isMutationMethod(config.method) || Boolean(config.showErrorToastOnRead);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) {
      const authHeader = `Bearer ${token}`;
      if (config.headers && typeof (config.headers as any).set === "function") {
        (config.headers as any).set("Authorization", authHeader);
      } else {
        const headers = ((config as any).headers ||= {});
        headers.Authorization = authHeader;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const shouldShowGlobalToast = shouldShowGlobalErrorToast(error);

    if (typeof window !== "undefined" && shouldShowGlobalToast) {
      if (!error?.response) {
        showApiError(
          error,
          "Unable to connect to server. Please check your network or backend URL."
        );
      } else if (status && status >= 500) {
        showApiError(error, "Server error. Please try again.");
      }
    }

    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      if (shouldShowGlobalToast) {
        showApiError(error, "Session expired. Please login again.");
      }
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// Admin Auth APIs
export const adminAuthAPI = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/admin/auth/login", data);
    if (response.data.token) {
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("admin", JSON.stringify(response.data.admin));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
  },
  getCurrentAdmin: () => {
    if (typeof window !== "undefined") {
      const admin = localStorage.getItem("admin");
      return admin ? JSON.parse(admin) : null;
    }
    return null;
  },
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminToken");
    }
    return null;
  },
  isAuthenticated: () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("adminToken");
    }
    return false;
  },
};

// Admin APIs
export const adminAPI = {
  create: async (data: any) => {
    const response = await api.post("/admins", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admins/${id}`, data);
    return response.data;
  },
  getAll: async (params?: any) => {
    const response = await api.get("/admins", { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admins/${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admins/${id}`);
    return response.data;
  },
};

// Product APIs
export const productAPI = {
  create: async (data: any) => {
    const response = await api.post("/products", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },
  getAll: async (params?: any) => {
    const response = await api.get("/products", { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  updateStock: async (id: string, data: { quantity: number; type: string; reason?: string }) => {
    const response = await api.patch(`/products/${id}/stock`, data);
    return response.data;
  },
};

// Category APIs
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get("/categories");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/categories", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.post(`/categories${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Dashboard cards API
export const deshboardAPI = {
  getAllCards: async () => {
    const response = await api.get("/admins/dashboard/cards");
    return response.data;
  }
}

export type PageConstructionSetting = {
  id: string;
  path: string;
  label: string;
  isUnderConstruction: boolean;
  message: string | null;
  updatedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const pageSettingsAPI = {
  getAll: async () => {
    const response = await api.get<PageConstructionSetting[]>("/page-settings");
    return response.data;
  },
  check: async (path: string, label?: string) => {
    const response = await api.post<PageConstructionSetting>("/page-settings/check", {
      path,
      label,
    });
    return response.data;
  },
  update: async (
    id: string,
    data: Partial<Pick<PageConstructionSetting, "isUnderConstruction" | "message" | "label">>
  ) => {
    const response = await api.patch<PageConstructionSetting>(`/page-settings/${id}`, data);
    return response.data;
  },
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  message: string;
  initials: string;
  isActive: boolean;
  createdAt: string;
};

export const testimonialAPI = {
  getAll: async () => {
    const response = await api.get<Testimonial[]>("/testimonials");
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/testimonials/${id}`);
    return response.data;
  },
};

// Inquiry APIs
export const inquiryAPI = {
  getAll: async () => {
    const response = await api.get("/inquiries/all");
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/inquiries/${id}/status`, { status });
    return response.data;
  },
};

// Service Inquiry APIs
export const serviceInquiryAPI = {
  getAll: async () => {
    const response = await api.get("/service-inquiries/all");
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/service-inquiries/${id}/status`, { status });
    return response.data;
  },
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
};

export { API_BASE_URL };


export default api;
