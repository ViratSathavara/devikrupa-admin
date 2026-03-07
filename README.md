# Devikrupa Admin

Admin dashboard frontend built with Next.js.

## Run

```bash
npm install
npm run dev
```

Default URL: `http://localhost:3000` (or configured port)

## API Architecture (SDK Based)

The admin app now uses SDK-based API access.

- Main compatibility layer: `src/lib/api.ts`
- SDK implementation: `src/lib/sdk/admin-sdk.ts`
- SDK guide: `src/lib/sdk/README.md`
- Full frontend SDK documentation: `SDK_DOCUMENTATION.md`

All API usage in admin pages/components should import from `@/lib/api`.

## Environment

- `NEXT_PUBLIC_API_URL` (optional)
  - Example: `http://localhost:4000`
  - `/api` is appended automatically if missing.

If `NEXT_PUBLIC_API_URL` is not set, the SDK auto-selects local/prod backend by runtime host.
