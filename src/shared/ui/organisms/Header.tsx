"use client"
import Image from "next/image"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"
import { useTheme } from "next-themes"

interface HeaderProps {
  themeFetched: string
}

export const Header = ({ themeFetched }: HeaderProps) => {
  const { theme } = useTheme()

  return (
    <header className="flex justify-between p-4">
      { (theme === 'light' || themeFetched === 'light') ? (
        <Image
          alt="Tehesa Logo"
          height={61}
          width={115}
          className="rounded-sm"
          src="/tehesa-logo.webp"
        />
      ): (
        <Image
          alt="Tehesa Logo"
          height={61}
          width={115}
          className="rounded-sm"
          src="/tehesa-logo-negativo.webp"
        />
      )}
      <ToggleDarkMode />
    </header>
  )
}
