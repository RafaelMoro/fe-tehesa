---
version: alpha
name: Tehesa
description: Current visual system for the Tehesa product catalog Next.js app.
colors:
  primary: "#4DF527"
  primary-50: "#E3FFD6"
  primary-100: "#B4FE99"
  primary-200: "#4DF527"
  primary-300: "#3BD11A"
  primary-400: "#24AD02"
  primary-500: "#23890C"
  primary-600: "#177303"
  primary-700: "#125D03"
  primary-800: "#0F4804"
  primary-900: "#0D3401"
  primary-950: "#0F2001"
  on-primary: "#0D3401"
  background: "#FFFFFF"
  foreground: "#171717"
  background-dark: "#0A0A0A"
  foreground-dark: "#EDEDED"
  surface: "#FFFFFF"
  surface-subtle: "#F9FAFB"
  gray-50: "#F9FAFB"
  gray-100: "#F3F4F6"
  gray-200: "#E5E7EB"
  gray-300: "#D1D5DB"
  gray-400: "#9CA3AF"
  gray-500: "#6B7280"
  gray-600: "#4B5563"
  gray-700: "#374151"
  gray-800: "#1F2937"
  gray-900: "#111827"
  danger: "#C81E1E"
  danger-hover: "#9B1C1C"
typography:
  body:
    fontFamily: Geist Sans
    fontSize: 1rem
    lineHeight: 1.5
    fontWeight: 400
  body-sm:
    fontFamily: Geist Sans
    fontSize: 0.875rem
    lineHeight: 1.25rem
    fontWeight: 400
  label:
    fontFamily: Geist Sans
    fontSize: 0.875rem
    lineHeight: 1.25rem
    fontWeight: 500
  mono:
    fontFamily: Geist Mono
    fontSize: 0.875rem
    lineHeight: 1.25rem
    fontWeight: 400
rounded:
  sm: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  full: 9999px
spacing:
  xs: 0.5rem
  sm: 0.75rem
  md: 1rem
  lg: 1.25rem
  xl: 1.5rem
components:
  button-primary:
    backgroundColor: "{colors.primary-200}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-300}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-700}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.primary-800}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
  button-danger-soft:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
  button-danger-soft-hover:
    backgroundColor: "{colors.danger-hover}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
---

## Overview

Tehesa is a product catalog UI built with HeroUI v3 (`@heroui/react`) on Next.js 15 App Router + React 19 + Tailwind v4, with a class-based light/dark theme driven by next-themes. The accent is a vivid green (`#4DF527`) used for primary actions; backgrounds and surfaces stay neutral; controls are rounded; copy is Spanish. Keep UI changes aligned with HeroUI's compound component API and Tailwind v4 utilities rather than introducing a parallel component or token system.

## Colors

The accent scale is a green ramp keyed to `primary-200 = #4DF527`. HeroUI's own `primary` token currently drives the in-app button fills, borders, and focus rings, so the intent is to remap HeroUI's `--primary-*` CSS variables to this scale (see "Do's and Don'ts"); until that wiring lands, treat the values here as the documented target and the live HeroUI blue defaults as a known gap.

- **Primary (#4DF527, `primary-200`):** the chosen accent — used on filled primary buttons and active controls. Bright, so primary text on light surfaces uses `primary-700`/`primary-800` for legibility, and white text fails contrast on the 50–300 range; on-primary is the dark `#0D3401` (`primary-900`).
- **Primary hover (`primary-300 = #3BD11A`):** slightly darker filled-state for primary buttons.
- **Secondary text/fill (`primary-700 = #125D03`):** outlined/secondary primary text on white surfaces.
- **Neutrals:** Tailwind gray scale (50–900) for surfaces, borders, secondary text, dashboard backgrounds, and dark mode.
- **Danger (#C81E1E):** destructive or risk actions, mirroring the existing HeroUI `danger-soft` Button variant.

Dark mode is `attribute="class"` (`<html class="dark">`) via `NextThemesProvider`, surfaced in `src/app/layout.tsx`; do not switch to `data-theme` or media mode unless the theme preference flow changes too.

## Typography

The app loads **Geist Sans** and **Geist Mono** via `next/font/google` in `src/app/layout.tsx` and exposes them as the CSS variables `--font-geist-sans` and `--font-geist-mono` on `<body>`.

- Use **Geist Sans** for interface text, labels, catalog content, and forms.
- Use **Geist Mono** only when the user explicitly asks for monospace, or when a true code/diagnostic block requires fixed-width alignment; do not use it for prices, IDs, SKUs, or metadata by default.
- Do not change font family unless explicitly requested; preserve the app-level Geist Sans typography.
- Existing Tailwind text utilities (`text-sm`, `text-base`, `font-medium`) are preferred over bespoke CSS.

## Layout

Tailwind v4 is wired in `src/app/globals.css` via `@import "tailwindcss"`, `@import "@heroui/styles"`, and a custom `dark` variant `&:is(.dark *)`. There is no extended Tailwind theme config; `tailwind.config.js` only sets `darkMode: "class"` and an empty `theme.extend` — HeroUI v4 content auto-detection handles app content; do not broaden its `content` array casually.

Use Tailwind's default spacing scale. There are no bespoke layout helpers in `globals.css` beyond the dark variant; prefer HeroUI layout primitives (`Card`, `Surface`, `Toolbar`, etc.) and Tailwind grid/flex utilities.

## Components

Buttons are HeroUI v3 `<Button variant="...">` using built-in variants. Current in-app variants:

- **`primary`**: filled primary action button (e.g. `ProductCard` "Ver detalles", `ProductVariantsDrawer` "Aceptar"). Target fill = `primary-200` with `on-primary` dark text, hover `primary-300`.
- **`secondary`**: outlined secondary button (e.g. `DropdownCategories`, `DropdownBrands`). Target = surface fill, `primary-700` text, hover = `primary-800` fill with `on-primary` text.
- **`danger-soft`**: outlined danger button (e.g. `ProductVariantsDrawer` close/cancel). Target = surface fill, `danger` text, hover = `danger-hover` fill with `on-primary` text.

HeroUI remains the component system. The accent mapping above is documentation; remap HeroUI's `--primary-*` CSS variables to this scale in `src/app/globals.css` as a deliberate, reviewed change (see "Do's and Don'ts"), not as a side effect of editing this file.

## Do's and Don'ts

- Do reuse HeroUI v3 components and built-in Button variants before adding new component abstractions.
- Do run `pnpm design:lint` after editing this file; fix any reported errors before committing.
- Do keep primary actions on the green `primary-*` scale defined here once HeroUI's `--primary-*` variables are remapped.
- Do prefer the `heroui-react` MCP (configured in `opencode.json`) for HeroUI v3 component/prop/variant questions.
- Don't generate Tailwind theme CSS from this file automatically into `globals.css` without an explicit review; `design:export --format css-tailwind` emits a candidate `@theme` block, verify it merges cleanly with HeroUI's own variables before applying.
- Don't add a second dark-mode mechanism; the app already uses `attribute="class"` with cookie persistence via `POST /api/preferences` and the Zustand `ChangeThemeStoreProvider`.
- Don't introduce Flowbite, Material UI, shadcn, or a parallel design-token pipeline alongside HeroUI unless a story explicitly calls for it.