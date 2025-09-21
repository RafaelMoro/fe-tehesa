"use client"

import { ReactNode, useRef, useContext  } from "react"
import { createThemeStore, ChangeThemeStoreApi, ChangeThemeStoreContext, type ChangeThemeStore } from "../store/change-theme.store"
import { useStore } from "zustand"

interface DashboardStoreProviderProps {
  children: ReactNode
}

export const DashboardStoreProvider = ({ children }: DashboardStoreProviderProps) => {
  const storeRef = useRef<ChangeThemeStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createThemeStore()
  }

  return (
    <ChangeThemeStoreContext.Provider value={storeRef.current}>
      {children}
    </ChangeThemeStoreContext.Provider>
  )
}

export const useChangeThemeStore = <T,>(
  selector: (store: ChangeThemeStore) => T,
): T => {
  const changeThemeStoreContext = useContext(ChangeThemeStoreContext)

  if (!changeThemeStoreContext) {
    throw new Error(`useDashboardStore must be used within DashboardStoreContext`)
  }

  return useStore(changeThemeStoreContext, selector)
}