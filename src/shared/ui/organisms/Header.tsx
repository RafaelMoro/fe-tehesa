"use client"
import { Image } from "@heroui/react"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"

interface HeaderProps {
  themeFetched: string
}

export const Header = ({ themeFetched }: HeaderProps) => {
  const logoSrc = themeFetched === "light" ? "/tehesa-logo.webp" : "/tehesa-logo-negativo.webp";

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