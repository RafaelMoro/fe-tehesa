"use client"
import { saveThemeApi } from "@/shared/utils/global.utils";
import { Button } from "@heroui/react"
import { RiMoonLine } from "@remixicon/react"
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ToggleDarkMode = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleDarkMode = async () => {
    const isLight = theme === "light"
    if (isLight) {
      await saveThemeApi('dark')
      setTheme('dark')
      return
    }

    await saveThemeApi('light')
    setTheme('light')
  }

  return (
    <Button isIconOnly onPress={toggleDarkMode}>
      <RiMoonLine />
    </Button>
  )
}
