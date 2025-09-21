"use client"
import { Image } from "@heroui/react"

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
      <button>Toggle dark mode</button>
    </header>
  )
}