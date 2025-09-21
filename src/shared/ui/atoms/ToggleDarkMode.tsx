"use client"
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

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button isIconOnly onClick={toggleDarkMode}>
      <RiMoonLine />
    </Button>
  )
}