"use client"
import { saveThemeApi } from "@/shared/utils/global.utils"
import { Button } from "@heroui/react"
import { RiMoonLine, RiSunLine } from "@remixicon/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ToggleDarkModeProps {
  showLabel?: boolean
}

export const ToggleDarkMode = ({ showLabel = false }: ToggleDarkModeProps) => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleDarkMode = async () => {
    const isLight = theme === "light"
    if (isLight) {
      await saveThemeApi("dark")
      setTheme("dark")
      return
    }

    await saveThemeApi("light")
    setTheme("light")
  }

  const isDark = mounted && theme === "dark"

  return (
    <Button
      isIconOnly={!showLabel}
      aria-label={showLabel ? undefined : "Cambiar tema"}
      onPress={toggleDarkMode}
      className="min-h-11 rounded-full bg-[#4DF527] text-[#0D3401] hover:bg-[#3BD11A]"
    >
      {isDark ? <RiSunLine className="size-5" /> : <RiMoonLine className="size-5" />}
      {showLabel && <span>Cambiar tema</span>}
    </Button>
  )
}
