import axios, { AxiosInstance } from "axios";
import { showApiError } from "../toast";

const LOCAL_API_BASE_URL = "http://localhost:4000/api";
const PRODUCTION_API_BASE_URL = "https://api.devikrupaelectricals.in/api";

const PRIVATE_IPV4_HOSTNAME_REGEX =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;

const normalizeApiBaseUrl = (value?: string): string | null => {
  const raw = value?.trim();
  if (!raw) return null;
  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const isLocalOrPrivateHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "0.0.0.0" ||
    PRIVATE_IPV4_HOSTNAME_REGEX.test(normalized) ||
    normalized.endsWith(".local")
  );
};

const inferRuntimeApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    const isDevelopmentRuntime = process.env.NODE_ENV === "development";
    if (isDevelopmentRuntime || isLocalOrPrivateHost(hostname)) {
      return LOCAL_API_BASE_URL;
    }
    return PRODUCTION_API_BASE_URL;
  }

  return process.env.NODE_ENV === "development"
    ? LOCAL_API_BASE_URL
    : PRODUCTION_API_BASE_URL;
};

const isMutationMethod = (method?: string): boolean =>
  ["post", "put", "patch", "delete"].includes((method ?? "get").toLowerCase());

type SdkErrorConfig = {
  skipErrorToast?: boolean;
  showErrorToastOnRead?: boolean;
  method?: string;
};

const shouldShowGlobalErrorToast = (error: unknown): boolean => {
  const config = ((error as { config?: SdkErrorConfig })?.config ?? {}) as SdkErrorConfig;
  if (Boolean(config.skipErrorToast)) {
    return false;
  }
  return isMutationMethod(config.method) || Boolean(config.showErrorToastOnRead);
};

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

export type DictionaryWord = {
  id: number;
  englishWord: string;
  gujaratiWord: string;
  wordType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DictionaryPhrase = {
  id: number;
  englishPhrase: string;
  gujaratiPhrase: string;
  context: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TranslationRule = {
  id: number;
  name: string | null;
  sourceLang: "en" | "gu";
  targetLang: "en" | "gu";
  pattern: string;
  replacement: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UnknownWord = {
  id: number;
  word: string;
  language: "en" | "gu";
  occurrences: number;
  status: string;
  suggestedTranslation: string | null;
  resolvedTranslation: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type ChatConversationStatus = "ACTIVE" | "CLOSED";
export type ChatSenderType = "CUSTOMER" | "ADMIN";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: ChatSenderType;
  message: string;
  userId: string | null;
  adminId: string | null;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  customerName: string;
  mobile: string;
  email: string | null;
  status: ChatConversationStatus;
  lastMessage: string | null;
  lastMessageAt: string | null;
  adminLastReadAt: string | null;
  customerLastReadAt: string | null;
  unreadForAdminCount: number;
  unreadForCustomerCount: number;
  closedAt: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  latestMessage: ChatMessage | null;
  _count: {
    messages: number;
  };
};

export class AdminSdkClient {
  readonly apiBaseUrl: string;
  readonly socketBaseUrl: string;
  readonly client: AxiosInstance;

  constructor(baseUrl?: string) {
    this.apiBaseUrl = normalizeApiBaseUrl(baseUrl ?? process.env.NEXT_PUBLIC_API_URL) ?? inferRuntimeApiBaseUrl();
    this.socketBaseUrl = this.apiBaseUrl.replace(/\/api$/, "");
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const languageHeader = "en";
      const headersWithSet = config.headers as
        | { set?: (name: string, value: string) => void }
        | undefined;
      if (typeof headersWithSet?.set === "function") {
        headersWithSet.set("x-language", languageHeader);
      } else {
        const configWithHeaders = config as {
          headers?: Record<string, string>;
        };
        const headers = (configWithHeaders.headers ??= {});
        headers["x-language"] = languageHeader;
      }

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("adminToken");
        if (token) {
          const authHeader = `Bearer ${token}`;
          if (typeof headersWithSet?.set === "function") {
            headersWithSet.set("Authorization", authHeader);
          } else {
            const configWithHeaders = config as {
              headers?: Record<string, string>;
            };
            const headers = (configWithHeaders.headers ??= {});
            headers.Authorization = authHeader;
          }
        }
      }
      return config;
    });

    this.client.interceptors.response.use(
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
  }

  adminAuth = {
    login: async (data: { email: string; password: string }) => {
      const response = await this.client.post("/admin/auth/login", data);
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

  admins = {
    create: async (data: Record<string, unknown>) => {
      const response = await this.client.post("/admins", data);
      return response.data;
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const response = await this.client.patch(`/admins/${id}`, data);
      return response.data;
    },
    getAll: async (params?: Record<string, unknown>) => {
      const response = await this.client.get("/admins", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await this.client.get(`/admins/${id}`);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await this.client.delete(`/admins/${id}`);
      return response.data;
    },
  };

  products = {
    create: async (data: Record<string, unknown>) => {
      const response = await this.client.post("/products", data);
      return response.data;
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const response = await this.client.patch(`/products/${id}`, data);
      return response.data;
    },
    getAll: async (params?: Record<string, unknown>) => {
      const response = await this.client.get("/products", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await this.client.get(`/products/${id}`);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await this.client.delete(`/products/${id}`);
      return response.data;
    },
    updateStock: async (id: string, data: { quantity: number; type: string; reason?: string }) => {
      const response = await this.client.patch(`/products/${id}/stock`, data);
      return response.data;
    },
  };

  categories = {
    getAll: async () => {
      const response = await this.client.get("/categories");
      return response.data;
    },
    create: async (data: Record<string, unknown>) => {
      const response = await this.client.post("/categories", data);
      return response.data;
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const response = await this.client.put(`/categories/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await this.client.delete(`/categories/${id}`);
      return response.data;
    },
  };

  dashboard = {
    getAllCards: async () => {
      const response = await this.client.get("/admins/dashboard/cards");
      return response.data;
    },
  };

  pageSettings = {
    getAll: async () => {
      const response = await this.client.get<PageConstructionSetting[]>("/page-settings");
      return response.data;
    },
    check: async (path: string, label?: string) => {
      const response = await this.client.post<PageConstructionSetting>("/page-settings/check", {
        path,
        label,
      });
      return response.data;
    },
    update: async (
      id: string,
      data: Partial<Pick<PageConstructionSetting, "isUnderConstruction" | "message" | "label">>
    ) => {
      const response = await this.client.patch<PageConstructionSetting>(`/page-settings/${id}`, data);
      return response.data;
    },
  };

  testimonials = {
    getAll: async () => {
      const response = await this.client.get<Testimonial[]>("/testimonials");
      return response.data;
    },
    delete: async (id: string) => {
      const response = await this.client.delete(`/testimonials/${id}`);
      return response.data;
    },
  };

  inquiries = {
    getAll: async () => {
      const response = await this.client.get("/inquiries/all");
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      const response = await this.client.patch(`/inquiries/${id}/status`, { status });
      return response.data;
    },
  };

  serviceInquiries = {
    getAll: async () => {
      const response = await this.client.get("/service-inquiries/all");
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      const response = await this.client.patch(`/service-inquiries/${id}/status`, { status });
      return response.data;
    },
  };

  translations = {
    getWords: async (params?: { search?: string; limit?: number }) => {
      const response = await this.client.get<DictionaryWord[]>("/translations/words", { params });
      return response.data;
    },
    createWord: async (data: {
      englishWord: string;
      gujaratiWord: string;
      wordType?: string;
    }) => {
      const response = await this.client.post<DictionaryWord>("/translations/words", data);
      return response.data;
    },
    updateWord: async (
      id: number,
      data: { englishWord: string; gujaratiWord: string; wordType?: string | null }
    ) => {
      const response = await this.client.patch<DictionaryWord>(`/translations/words/${id}`, data);
      return response.data;
    },
    deleteWord: async (id: number) => {
      const response = await this.client.delete(`/translations/words/${id}`);
      return response.data;
    },

    getPhrases: async (params?: { search?: string; limit?: number }) => {
      const response = await this.client.get<DictionaryPhrase[]>("/translations/phrases", { params });
      return response.data;
    },
    createPhrase: async (data: {
      englishPhrase: string;
      gujaratiPhrase: string;
      context?: string;
    }) => {
      const response = await this.client.post<DictionaryPhrase>("/translations/phrases", data);
      return response.data;
    },
    updatePhrase: async (
      id: number,
      data: { englishPhrase: string; gujaratiPhrase: string; context?: string | null }
    ) => {
      const response = await this.client.patch<DictionaryPhrase>(`/translations/phrases/${id}`, data);
      return response.data;
    },
    deletePhrase: async (id: number) => {
      const response = await this.client.delete(`/translations/phrases/${id}`);
      return response.data;
    },

    getRules: async (params?: {
      sourceLang?: "en" | "gu";
      targetLang?: "en" | "gu";
      limit?: number;
    }) => {
      const response = await this.client.get<TranslationRule[]>("/translations/rules", { params });
      return response.data;
    },
    createRule: async (data: {
      name?: string;
      sourceLang: "en" | "gu";
      targetLang: "en" | "gu";
      pattern: string;
      replacement: string;
      priority?: number;
      isActive?: boolean;
    }) => {
      const response = await this.client.post<TranslationRule>("/translations/rules", data);
      return response.data;
    },
    updateRule: async (
      id: number,
      data: Partial<{
        name: string | null;
        sourceLang: "en" | "gu";
        targetLang: "en" | "gu";
        pattern: string;
        replacement: string;
        priority: number;
        isActive: boolean;
      }>
    ) => {
      const response = await this.client.patch<TranslationRule>(`/translations/rules/${id}`, data);
      return response.data;
    },
    deleteRule: async (id: number) => {
      const response = await this.client.delete(`/translations/rules/${id}`);
      return response.data;
    },

    getUnknownWords: async (params?: { status?: string; limit?: number }) => {
      const response = await this.client.get<UnknownWord[]>("/translations/unknown-words", {
        params,
      });
      return response.data;
    },
    updateUnknownWord: async (
      id: number,
      data: Partial<{
        status: string;
        suggestedTranslation: string | null;
        resolvedTranslation: string | null;
      }>
    ) => {
      const response = await this.client.patch<UnknownWord>(
        `/translations/unknown-words/${id}`,
        data
      );
      return response.data;
    },

    test: async (data: {
      text: string;
      sourceLang?: "en" | "gu";
      targetLang?: "en" | "gu";
    }) => {
      const response = await this.client.post<{
        text: string;
        sourceLang: "en" | "gu";
        targetLang: "en" | "gu";
        translatedText: string;
        fromCache: boolean;
      }>("/translations/test", data);
      return response.data;
    },
  };

  chats = {
    getConversations: async (params?: {
      status?: ChatConversationStatus | "ALL";
      take?: number;
    }) => {
      const response = await this.client.get<ChatConversation[]>("/chat/admin/conversations", {
        params,
      });
      return response.data;
    },
    getConversationMessages: async (conversationId: string) => {
      const response = await this.client.get<{
        conversation: ChatConversation;
        messages: ChatMessage[];
      }>(`/chat/admin/conversations/${conversationId}/messages`);
      return response.data;
    },
    sendMessage: async (conversationId: string, message: string) => {
      const response = await this.client.post<{ message: ChatMessage }>(
        `/chat/admin/conversations/${conversationId}/messages`,
        { message }
      );
      return response.data;
    },
    markConversationRead: async (conversationId: string) => {
      const response = await this.client.patch<{ conversation: ChatConversation }>(
        `/chat/admin/conversations/${conversationId}/read`
      );
      return response.data;
    },
    closeConversation: async (conversationId: string) => {
      const response = await this.client.patch<{ conversation: ChatConversation }>(
        `/chat/admin/conversations/${conversationId}/close`
      );
      return response.data;
    },
    reopenConversation: async (conversationId: string) => {
      const response = await this.client.patch<{ conversation: ChatConversation }>(
        `/chat/admin/conversations/${conversationId}/reopen`
      );
      return response.data;
    },
    convertToInquiry: async (conversationId: string) => {
      const response = await this.client.post(
        `/chat/admin/conversations/${conversationId}/convert-to-inquiry`
      );
      return response.data;
    },
  };

  upload = {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${this.apiBaseUrl}/upload/image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      return res.json();
    },
  };
}

export const createAdminSdkClient = (baseUrl?: string) => new AdminSdkClient(baseUrl);
