# Admin SDK Usage

## Files

- `src/lib/sdk/admin-sdk.ts`: SDK client class and typed admin resources.
- `src/lib/api.ts`: compatibility export layer used by current pages.

## Resource Mapping

- `adminAuthAPI` -> `sdk.adminAuth`
- `adminAPI` -> `sdk.admins`
- `productAPI` -> `sdk.products`
- `categoryAPI` -> `sdk.categories`
- `deshboardAPI` -> `sdk.dashboard`
- `pageSettingsAPI` -> `sdk.pageSettings`
- `testimonialAPI` -> `sdk.testimonials`
- `inquiryAPI` -> `sdk.inquiries`
- `serviceInquiryAPI` -> `sdk.serviceInquiries`
- `translationAPI` -> `sdk.translations`
- `chatAPI` -> `sdk.chats`
- `uploadImage` -> `sdk.upload.image`

## Adding New Endpoint

1. Add a typed method inside `AdminSdkClient`.
2. Re-export via `src/lib/api.ts` to keep app imports stable.
3. Keep naming aligned to backend route group.

## Auth and Headers

- Admin token is read from `localStorage.adminToken`.
- Default language header is `x-language: en`.
