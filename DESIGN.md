---
version: alpha
name: Kraft Envios
description: Current visual system for the Kraft Envios Next.js app.
colors:
  primary: "#1A56DB"
  primary-50: "#EBF5FF"
  primary-100: "#E1EFFE"
  primary-200: "#C3DDFD"
  primary-300: "#A4CAFE"
  primary-400: "#76A9FA"
  primary-500: "#3F83F8"
  primary-600: "#1C64F2"
  primary-700: "#1A56DB"
  primary-800: "#1E429F"
  primary-900: "#233876"
  on-primary: "#FFFFFF"
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
    backgroundColor: "{colors.primary-700}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 0.5rem 1.25rem
  button-primary-hover:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-700}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 0.5rem 1.25rem
  button-secondary-hover:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 0.5rem 1.25rem
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  button-gray-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gray-600}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 0.5rem 1.25rem
---

## Overview

Kraft Envios uses a practical Flowbite React + Tailwind v4 interface: neutral dashboards, blue primary actions, rounded controls, and cookie-backed light/dark theme switching. Keep UI changes aligned with the existing utility-class style rather than introducing a parallel component or token system.

## Colors

The primary scale is Flowbite React's default `primary` blue scale. The project currently uses utilities such as `bg-primary-700`, `text-primary-700`, `focus:ring-primary-300`, and their dark variants.

- **Primary (#1A56DB):** main action color, normally used as `primary-700` in buttons.
- **Primary hover (#1E429F):** darker action state, normally `primary-800`.
- **Neutrals:** Tailwind/Flowbite gray scale for surfaces, borders, secondary text, dashboard backgrounds, and dark mode.
- **Danger (#C81E1E):** destructive or risk actions, mirroring the existing red button utility string.

Dark mode is driven by `<html data-theme="dark">` and Tailwind's custom `dark:` variant in `src/app/globals.css`; do not switch this to media or class mode unless the theme preference flow changes too.

## Typography

The app loads Geist Sans and Geist Mono with `next/font/local` in `src/app/layout.tsx` from `src/app/fonts/GeistVF.woff` and `src/app/fonts/GeistMonoVF.woff`.

- Use **Geist Sans** for interface text, labels, dashboard content, and forms.
- Use **Geist Mono** only when the user explicitly asks for monospace or when a true code/diagnostic block requires fixed-width alignment; do not use it for guide numbers, IDs, prices, or metadata by default.
- Do not change font family unless explicitly requested; preserve the app-level Geist Sans typography.
- Existing Flowbite/Tailwind text utilities (`text-sm`, `text-base`, `font-medium`) are preferred over bespoke CSS.

## Layout

Tailwind v4 is configured in `src/app/globals.css` through `@import "tailwindcss"`, `@plugin 'flowbite-react/plugin/tailwindcss'`, and `.flowbite-react/class-list.json` as a source. There is no separate Tailwind config file.

Use Tailwind's default spacing scale. Existing dashboard-specific layout helpers are `.grid-dashboard` and `.grid-card-quote` in `src/app/globals.css`.

## Components

Buttons are currently represented by shared utility strings in `src/shared/constants/global.constants.ts`:

- `primaryButtonCSS`: filled primary button, `bg-primary-700`, white text, `hover:bg-primary-800`.
- `secondaryButtonCSS`: outlined primary button, primary text, primary hover fill.
- `darkRedButtonCSS`: outlined danger button with red hover fill.
- `greySecondaryCSS`: outlined gray secondary button.

Flowbite React remains part of the UI stack. Dashboard drawer header colors are customized locally in `src/app/dashboard/page.tsx` with `createTheme` and `ThemeProvider`.

## Do's and Don'ts

- Do reuse Flowbite React components and existing shared button class strings before adding new component abstractions.
- Do keep primary actions on the Flowbite `primary-*` scale unless a real rebrand happens.
- Do run `pnpm design:lint` after editing this file.
- Don't generate Tailwind theme CSS from this file yet; it documents the current system for agents and humans.
- Don't add a second dark-mode mechanism; the app already uses `data-theme` with cookie persistence.
