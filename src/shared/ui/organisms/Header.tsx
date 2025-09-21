"use client"
import { Image } from "@heroui/react"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"

interface HeaderProps {
  themeFetched: string
}

export const Header = ({ themeFetched }: HeaderProps) => {
  return (
    <header className="flex justify-between p-4">
      { themeFetched === 'light' ? (
        <Image
          alt="Tehesa Logo"
          height={61}
          width={115}
          radius="sm"
          src="/tehesa-logo.webp"
        />
      ): (
        <Image
          alt="Tehesa Logo"
          height={61}
          width={115}
          radius="sm"
          src="/tehesa-logo-negativo.webp"
        />
      )}
      <ToggleDarkMode />
    </header>
  )
}