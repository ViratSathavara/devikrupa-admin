import {
  createAdminSdkClient,
  type ChatConversation,
  type ChatConversationStatus,
  type ChatMessage,
  type ChatSenderType,
  type DictionaryPhrase,
  type DictionaryWord,
  type PageConstructionSetting,
  type Testimonial,
  type TranslationRule,
  type UnknownWord,
} from "./sdk/admin-sdk";

const sdk = createAdminSdkClient();

export const API_BASE_URL = sdk.apiBaseUrl;
export const SOCKET_BASE_URL = sdk.socketBaseUrl;

export const adminAuthAPI = sdk.adminAuth;
export const adminAPI = sdk.admins;
export const productAPI = sdk.products;
export const categoryAPI = sdk.categories;
export const deshboardAPI = sdk.dashboard;
export const pageSettingsAPI = sdk.pageSettings;
export const testimonialAPI = sdk.testimonials;
export const inquiryAPI = sdk.inquiries;
export const serviceInquiryAPI = sdk.serviceInquiries;
export const translationAPI = sdk.translations;
export const chatAPI = sdk.chats;
export const uploadImage = sdk.upload.image;

export type {
  PageConstructionSetting,
  Testimonial,
  DictionaryWord,
  DictionaryPhrase,
  TranslationRule,
  UnknownWord,
  ChatConversationStatus,
  ChatSenderType,
  ChatMessage,
  ChatConversation,
};

export default sdk.client;
