export const THEME_COOKIE_KEY = "tehesa-theme"

export const PRF_VAL_001 = "PRF_VAL_001"
export const MSG_PRF_VAL_001_MISSING = "Theme is required"
export const MSG_PRF_VAL_001_TYPE = "Theme must be a string"
export const MSG_PRF_VAL_001_VALUE = "Theme must be 'light' or 'dark'"
export const MSG_PRF_VAL_001_MALFORMED = "Request body is not valid JSON"

export const APP_THEMES = ["light", "dark"] as const

export type AppTheme = (typeof APP_THEMES)[number]

export const isAppTheme = (value: unknown): value is AppTheme =>
  typeof value === "string" &&
  (APP_THEMES as readonly string[]).includes(value)

export const DEFAULT_THEME: AppTheme = "light"
