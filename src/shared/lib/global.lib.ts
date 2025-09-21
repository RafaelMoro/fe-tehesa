"use server"
import { cookies } from 'next/headers'
import { THEME_COOKIE_KEY } from '../constants/global.constants'

export const getThemePreference = async () => {
  const cookieStore = await cookies()
  const theme = cookieStore.get(THEME_COOKIE_KEY)?.value
  if (!theme) {
    // Return default
    return 'light'
  }
  return theme
}

export const saveThemeCookie = async (theme: string): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.set(THEME_COOKIE_KEY, theme, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  })
}
