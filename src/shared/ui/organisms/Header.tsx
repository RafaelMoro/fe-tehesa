"use client"
import { Image } from "@heroui/react"
import { useTheme } from "next-themes";

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"

export const Header = () => {
  const { theme } = useTheme();
  const logoSrc = theme === "light" ? "/tehesa-logo.webp" : "/tehesa-logo-negativo.webp";

  return (
    <header className="flex justify-between p-4">
      <Image
        alt="Tehesa Logo"
        height={61}
        width={115}
        radius="sm"
        src={logoSrc}
      />
      <ToggleDarkMode />
    </header>
  )
}