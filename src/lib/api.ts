import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
      return localStorage.getItem("token");
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

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
};


export default api;
