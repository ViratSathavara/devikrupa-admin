# Admin Frontend SDK Documentation

## 1. Overview

This app uses an internal SDK client for all backend API calls.

Primary files:

- `src/lib/sdk/admin-sdk.ts`: SDK class and admin resource methods
- `src/lib/api.ts`: stable exports used by pages/components

## 2. Base URL Strategy

Resolution order:

1. `NEXT_PUBLIC_API_URL`
2. Runtime inference:
   - local/private host -> `http://localhost:4000/api`
   - otherwise -> `https://api.devikrupaelectricals.in/api`

The SDK normalizes base URLs and ensures `/api` suffix exists.

## 3. Auth + Headers

- Admin token stored in `localStorage.adminToken`
- Admin profile stored in `localStorage.admin`
- Language header set to `x-language: en`
- Auth header sent as `Authorization: Bearer <adminToken>`

## 4. Exported API Surface

Imported from `@/lib/api`:

- `adminAuthAPI`
- `adminAPI`
- `productAPI`
- `categoryAPI`
- `deshboardAPI`
- `pageSettingsAPI`
- `testimonialAPI`
- `inquiryAPI`
- `serviceInquiryAPI`
- `translationAPI`
- `chatAPI`
- `uploadImage`
- `API_BASE_URL`
- `SOCKET_BASE_URL`

## 5. Error + Session Handling

Global behavior is centralized in SDK interceptor:

- Network failure -> connection message toast
- 5xx -> server error toast
- 401 -> clear admin storage and redirect to `/login`

## 6. How to Add New Endpoint

1. Add method under resource in `AdminSdkClient` (`src/lib/sdk/admin-sdk.ts`).
2. Re-export via `src/lib/api.ts` for compatibility.
3. Keep method names aligned to backend route groups.

## 7. Migration Rule

Do not call `axios` directly from pages/components.

All requests must go through `@/lib/api`, backed by the SDK client.
