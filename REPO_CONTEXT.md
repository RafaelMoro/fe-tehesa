# Repository Context - kraft-envios-fe

**Last Updated:** 2026-06-27

A living reference for AI agents and developers working in this repository. It documents the app wiring, module boundaries, data flow, and conventions that are not obvious from a single file read.

> Treat this file as a map, not a contract. The ground truth is the code.

## Overview

`kraft-envios-fe` is a Next.js 14 App Router frontend for shipping workflows: login/register, quotes, addresses, guide creation for multiple couriers, guide viewing, and profit-margin configuration. It proxies a backend through Next route handlers under `src/app/api/**`.

**Tech stack:**

- Next.js 14 App Router + React 18 + TypeScript strict mode.
- pnpm lockfile; `pnpm-workspace.yaml` only contains `allowBuilds`, not packages.
- Tailwind v4 through `@tailwindcss/postcss`; no `tailwind.config.*` file.
- Flowbite React with `next.config.mjs` wrapped by `flowbite-react/plugin/nextjs`.
- TanStack Query v5 via `src/features/QueryProviderWrapper.tsx`.
- `react-hook-form` + `yup` for forms.
- `axios` for HTTP calls; `jose` for signed session cookies.
- Jest 30 + Testing Library in jsdom.

## High-Level Architecture

```text
Browser
  │  session + user-info httpOnly cookies set by POST /api
  ▼
Next.js App Router
  ├── src/app/          pages, root layout, route handlers
  ├── src/features/     domain UI (Login, Dashboard, Quotes, Addresses, Guides, ProfitMargin)
  ├── src/shared/       reusable UI, hooks, utils, types, constants, server libs
  └── src/app/api/      BFF routes and cookie utilities
        ├── backend proxies via process.env.BACKEND_URI
        ├── auth via jose-signed session cookie and getAccessToken()
        └── SAT product lookup via NEXT_PUBLIC_GET_SAT_PRODUCT_URI
```

Key invariants:

- `src/app/layout.tsx` is an async server layout; it reads the theme cookie and wraps the app in `QueryProviderWrapper`.
- `QueryProviderWrapper` intentionally creates the `QueryClient` inside `useRef`; do not move it to module scope or caches can be shared across requests/users.
- `src/app/page.tsx` is the login entrypoint. It redirects authenticated users to `/dashboard`, otherwise renders `features/Login/Login`.
- `src/app/dashboard/page.tsx` reads session/user cookies server-side, wraps Flowbite `ThemeProvider`, and dynamically imports `features/Dashboard/Dashboard` with `ssr: false`.
- The Dashboard component owns the selected screen in local React state and saves screen preference through a server action in `src/shared/lib/preferences.lib.ts`.

## Directory Layout

### `src/app/`

| Path                             | Purpose                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `layout.tsx`                     | Root layout; local Geist fonts, global styles, theme cookie, QueryProvider wrapper. |
| `page.tsx`                       | Login route `/`; redirects to `/dashboard` when `getAccessToken()` returns a token. |
| `dashboard/page.tsx`             | Authenticated dashboard shell; server cookie read + client-only dashboard import.   |
| `register/page.tsx`              | Registration page.                                                                  |
| `forgot-password/page.tsx`       | Forgot-password page.                                                               |
| `reset-password/[slug]/page.tsx` | Reset-password page.                                                                |
| `api/**/route.ts`                | Next route handlers; mostly backend proxies.                                        |
| `fonts/`                         | Local Geist font files used by `next/font/local`.                                   |

### `src/features/`

| Domain                             | Purpose                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Login/`                           | Login, registration, forgot-password, and reset-password UI.                                                |
| `Dashboard/`                       | Dashboard shell and subscreens (`QuotesSubscreen`, `Order`, `MarginProfitSubscreen`, `AddressesSubscreen`). |
| `Quotes/`                          | Quote form/cards/copy flows.                                                                                |
| `Addresses/`                       | Address management forms, previews, dropdowns, pending GE address UI.                                       |
| `AutocompleteZipcode/`             | Zipcode autocomplete inputs and region dropdowns.                                                           |
| `Guides/`                          | Guide creation/viewing for MN, GE, PKK, and Tone flows.                                                     |
| `Guides-DB/`                       | DB-backed create flow (pre-select, multi-step modal, result semantics for `created`/`failed`).              |
| `ProfitMargin/`                    | Courier profit-margin forms/cards.                                                                          |
| `QueryProviderWrapper.tsx`         | App-wide TanStack Query provider.                                                                           |
| `AppRouterContextProviderMock.tsx` | Test helper for router context.                                                                             |

### `src/shared/`

| Subdir                                 | Purpose                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ui/atoms`, `ui/organisms`, `ui/icons` | Reusable UI primitives and compositions. There is no `molecules` folder in this repo.              |
| `hooks`                                | Reusable client hooks such as media query, notifications, address lookup, autocomplete, and steps. |
| `lib`                                  | Server-oriented helpers: auth/session cookies and preferences.                                     |
| `utils`                                | Pure helpers for quotes, guides, addresses, login, local storage, and globals.                     |
| `constants`                            | Route paths, API endpoints, messages, local-storage keys, and domain constants.                    |
| `types`                                | Shared TypeScript DTOs and UI types.                                                               |

## API Route Inventory

Most proxy routes read `getAccessToken()` from `src/shared/lib/auth.lib.ts`, return `400` when it is missing, attach `Authorization: Bearer <token>`, and unwrap backend errors from `error.response.data.error.message`.

| Route                       | Methods                        | Upstream / purpose                                                                                                                              |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api`                      | `POST`                         | Login; posts to `${BACKEND_URI}/auth/`, signs the returned cookie value with `jose`, and sets `session` + `user-info` cookies.                  |
| `/api/auth/sign-out`        | `GET`                          | Deletes session/user cookies and revalidates `/` and `/dashboard`.                                                                              |
| `/api/auth/create-user`     | `POST`                         | Proxies user creation to `${BACKEND_URI}/users`.                                                                                                |
| `/api/auth/forgot-password` | `POST`                         | Proxies to `${BACKEND_URI}/users/forgot-password`.                                                                                              |
| `/api/auth/reset-password`  | `POST`                         | Proxies to `${BACKEND_URI}/users/reset-password/{slug}`.                                                                                        |
| `/api/quotes`               | `POST`                         | Proxies quote requests to `${BACKEND_URI}/quotes`.                                                                                              |
| `/api/address-info`         | `GET`                          | Requires `zipcode`; proxies to `${BACKEND_URI}/quotes/address-info/{zipcode}` and returns neighborhoods.                                        |
| `/api/address`              | `GET`, `POST`, `PUT`, `DELETE` | CRUD proxy for `${BACKEND_URI}/addresses`; delete encodes the address alias in the URL.                                                         |
| `/api/ge-address`           | `GET`, `POST`, `PUT`, `DELETE` | GE address proxy for `${BACKEND_URI}/ge/addresses` and `${BACKEND_URI}/ge/address/{id}`; PUT blocks alias edits.                                |
| `/api/guides/get-guides`    | `GET`                          | Proxies to `${BACKEND_URI}/guides`.                                                                                                             |
| `/api/guides-db`            | `POST`                         | Proxies to `${BACKEND_URI}/guides/db/create`; returns 201 even when upstream `data.status === 'failed'` (saved DB record, not transport error). |
| `/api/guides/mn`            | `POST`                         | Creates MN guide via `${BACKEND_URI}/mn/create-guide`; treats null-guide or embedded 400 message as failure.                                    |
| `/api/guides/tone`          | `POST`                         | Creates Tone guide via `${BACKEND_URI}/tone/create-guide`; same null-guide/embedded-400 failure rule as MN.                                     |
| `/api/guides/ge`            | `POST`                         | Creates GE guide via `${BACKEND_URI}/ge/create-guide`.                                                                                          |
| `/api/guides/pkk`           | `POST`, `GET`                  | Creates PKK guide via `${BACKEND_URI}/pkk/create-guide`; `GET` fetches a single guide by `guide` query param.                                   |
| `/api/margin-profit`        | `GET`, `POST`                  | Reads `${BACKEND_URI}/global-configs/profit-margin`; POST sends a PUT to `/global-configs/profit-margin-providers`.                             |
| `/api/product-sat`          | `POST`                         | Calls `NEXT_PUBLIC_GET_SAT_PRODUCT_URI?search=...` directly, slices results to 100, and formats code/description pairs.                         |
| `/api/preferences/theme`    | `POST`                         | Cookie setter; saves Flowbite theme mode through `saveThemeCookie()`.                                                                           |

## Auth And Cookies

- Cookie keys live in `src/shared/constants/global.constants.ts`: `session`, `user-info`, `theme`, and `dashboard-screen`.
- `encodeAccessToken()` signs `{ accessToken }` with `SESSION_SECRET_KEY` using HS256 and a 7-day JWT expiry.
- `saveSessionCookie()` and `saveUserInfo()` set httpOnly, secure, sameSite strict cookies. The login route also sets response cookies with `secure: process.env.NODE_ENV === 'production'` and 5-day `maxAge`.
- Client components should not read auth cookies directly. Use route handlers or server helpers.
- Preferences in `src/shared/lib/preferences.lib.ts` are server actions (`"use server"`): theme and dashboard screen are cookie-backed.

## Environment Variables

Required values are documented in `.env.example`:

- `BACKEND_URI` - backend API base URL.
- `SESSION_SECRET_KEY` - key used by `jose` for the signed session cookie.
- `NEXT_PUBLIC_LOCAL_STORAGE` - local-storage namespace.
- `FRONTEND_URI` - frontend origin.
- `NEXT_PUBLIC_GET_SAT_PRODUCT_URI` - external SAT product search endpoint.
- `NEXT_PUBLIC_DEFAULT_EMAIL` - default email used for external API data.

## Commands

| Command                                        | Purpose                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                                     | Start Next dev server on port 3000.                                |
| `pnpm build`                                   | Production build; use for full verification.                       |
| `pnpm start`                                   | Start a built Next app.                                            |
| `pnpm lint`                                    | Run `next lint` with `next/core-web-vitals` and `next/typescript`. |
| `pnpm exec tsc --noEmit`                       | TypeScript-only check; there is no package script for this.        |
| `pnpm test`                                    | Jest run in jsdom; coverage is always collected into `coverage/`.  |
| `pnpm test -- __tests__/path/to/file.test.tsx` | Focus one test file. Add `-t "test name"` to focus by name.        |

## Testing Conventions

- Jest uses `next/jest`, `testEnvironment: "jsdom"`, and `jest.setup.ts`.
- `jest.setup.ts` imports `@testing-library/jest-dom`, installs `TextEncoder`/`TextDecoder`, and adds a JSON-based `structuredClone` fallback.
- `__tests__/mocks/` and `__tests__/utils-test/` are ignored as test suites. Use them for fixtures/helpers imported by real tests.
- Real tests currently live under `__tests__/feature/*`, `__tests__/components/*`, and `__tests__/home.test.tsx`.
- Keep new tests near the matching feature/shared UI boundary.
- `.github/copilot-instructions.md` contains project-specific unit test rules: router/query wrappers, `userEvent` over `fireEvent`, avoid mocking internal components, avoid styling assertions, preserve skipped tests, and match mock data to real return shapes.

## Styling And UI

- Tailwind v4 is configured only through `postcss.config.mjs` with `@tailwindcss/postcss`.
- Flowbite React is in use; preserve the `withFlowbiteReact(nextConfig)` wrapper in `next.config.mjs`.
- Dashboard customizes Flowbite `drawer` theme locally in `src/app/dashboard/page.tsx`.
- Root layout sets `<html lang="en" data-theme={theme}>`; update deliberately if changing locale/theme behavior.

## Conventions And Gotchas

- Path alias: `@/*` maps to `./src/*`.
- Add `'use client'` to files that use hooks, browser APIs, router hooks, or client-only libraries.
- Keep backend proxy behavior consistent with existing route handlers unless intentionally fixing a bug: access-token check, `Authorization` header, `NextResponse.json`, and 400 error shape.
- Do not assume all backend responses have the same envelope. Existing routes return a mix of raw upstream data, `{ data }`, `{ message }`, and feature-specific objects.
- `src/app/api/product-sat/route.ts` does not use `BACKEND_URI`; it calls `NEXT_PUBLIC_GET_SAT_PRODUCT_URI` directly.
- `src/features/Dashboard/Dashboard.tsx` is client-only and has separate mobile/tablet vs desktop rendering via `useMediaQuery()`.
- Avoid adding new state libraries. This repo uses local React state, cookies/server actions, TanStack Query, and local-storage helpers; there is no Zustand store.

## Key Files

| File                                    | Purpose                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `AGENTS.md`                             | Compact agent instructions: commands, architecture, env, tests, styling. |
| `package.json`                          | Scripts and dependencies.                                                |
| `next.config.mjs`                       | Next config; transpiles `jose` and wraps Flowbite React plugin.          |
| `tsconfig.json`                         | Strict TypeScript, `@/*` path alias.                                     |
| `jest.config.ts`                        | Jest + coverage + ignored helper directories.                            |
| `jest.setup.ts`                         | Global test setup.                                                       |
| `.github/copilot-instructions.md`       | Unit test conventions and mocking rules.                                 |
| `src/app/layout.tsx`                    | Root layout, theme cookie, QueryProvider.                                |
| `src/app/page.tsx`                      | Login entrypoint and authenticated redirect.                             |
| `src/app/dashboard/page.tsx`            | Dashboard server wrapper + Flowbite theme.                               |
| `src/features/QueryProviderWrapper.tsx` | TanStack Query client provider with per-request-safe `useRef`.           |
| `src/shared/lib/auth.lib.ts`            | Session encode/decode, user-info cookie, sign-out helpers.               |
| `src/shared/lib/preferences.lib.ts`     | Theme and dashboard-screen cookie actions.                               |

## Open Questions

- There are no CI workflow files in this checkout; branch, PR label, release, and deployment rules are not documented in-repo.
- Several route handlers collapse upstream failures into `400` and sometimes return different error shapes. Confirm desired API contract before normalizing.
- The backend contract is inferred only from this frontend's route handlers and TypeScript types; no OpenAPI or backend repo reference is present here.
