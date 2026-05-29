---
name: SchulSaniApp architecture
description: Key decisions, routing quirks, and env setup for the SchulSaniApp project
---

## API URL routing
- API server: previewPath `/api` (from `.replit-artifact/artifact.toml`), local port 8080
- Express: `app.use("/api", router)` — Replit proxy forwards full path, so `/api/auth/login` hits the server as `/api/auth/login` → router handles `/auth/login`. Correct.
- Mobile app: `setBaseUrl("https://${EXPO_PUBLIC_DOMAIN}")` — orval generates paths starting with `/api/...` which resolves to the API server correctly.
- `app.set("trust proxy", 1)` required — Replit proxy sends X-Forwarded-For header, express-rate-limit needs trust proxy enabled.

## Codegen quirks
- Orval zod config MUST NOT have `schemas: { path: "generated/types" }` — it generates TypeScript types that conflict with Zod schema names (both export `LoginResponse`). Keep only `client: "zod"` with `target: "generated"`.
- Orval regenerates `lib/api-zod/src/index.ts` each run. Without the schemas config, the only export is `export * from "./generated/api"`.
- Run orval directly (`pnpm exec orval --config ./orval.config.ts`) to avoid the typecheck step during development.

## Owner bootstrap
- `FIRST_ADMIN_USERNAME=viktor.gnjatic` env var set in shared environment
- First login with this username → gets `role: owner, isActive: true` automatically
- All other new users → `role: sanitaeter, isActive: false` (pending activation)

## expo-secure-store web compat
- expo-secure-store v15 doesn't work on web (function API differs)
- Solution: `lib/storage.ts` wraps both — uses `AsyncStorage` on web, `expo-secure-store` (dynamic import) on native
- Always use `storage.getItem/setItem/deleteItem` from `@/lib/storage` instead of SecureStore directly

## DB schema push
- `pnpm --filter @workspace/db run push` — pushes drizzle schema to database
- DB is Replit's managed postgres (DATABASE_URL injected automatically)

## ISERV_MOCK
- `ISERV_MOCK=true` env var bypasses real IServ — accepts any password, generates displayName from username dots
- Set in shared env: all envs use mock until ISERV_URL is configured
