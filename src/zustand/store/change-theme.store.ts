import { AppTheme } from '@/shared/types/global.types';
import { createContext } from 'react';
import { createStore } from 'zustand/vanilla'

export type ChangeThemeState = {
  theme: AppTheme
}

export type ChangeThemeActions = {
  updateTheme: (theme: AppTheme) => void
}

export type ChangeThemeStore = ChangeThemeState & ChangeThemeActions

export const defaultInitState: ChangeThemeState = {
  theme: 'light',
}

export const createThemeStore = (
  initState: ChangeThemeState = defaultInitState,
) => {
  return createStore<ChangeThemeStore>()((set) => ({
    ...initState,
    updateTheme: (theme: AppTheme) => set((state) => {
      return {
        ...state,
        theme,
      }
    }),
  }))
}

export type ChangeThemeStoreApi = ReturnType<typeof createThemeStore>
export const ChangeThemeStoreContext = createContext<ChangeThemeStoreApi | undefined>(
  undefined,
)