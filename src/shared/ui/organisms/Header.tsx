"use client"
import { Image } from "@heroui/react"
import { ToggleDarkMode } from "../atoms/ToggleDarkMode"

export const Header = () => {
  return (
    <header className="flex justify-between p-4">
      <Image
        alt="Tehesa Logo"
        height={61}
        width={115}
        radius="sm"
        src="/tehesa-logo-negativo.webp"
      />
      <ToggleDarkMode />
    </header>
  )
}