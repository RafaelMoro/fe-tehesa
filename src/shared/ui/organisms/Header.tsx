"use client"
import Image from "next/image"
import { useEffect, useState } from "react"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"
import { CartCount } from "../atoms/CartCount"
import { useTheme } from "next-themes"
import type { AppTheme } from "@/shared/types/global.types"

interface HeaderProps {
  themeFetched: AppTheme
}

export const Header = ({ themeFetched }: HeaderProps) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoTheme = mounted ? theme : themeFetched

  return (
    <header className="flex justify-between p-4">
      <Image
        alt="Tehesa Logo"
        height={61}
        width={115}
        className="rounded-sm"
        src={logoTheme === "dark" ? "/tehesa-logo-negativo.webp" : "/tehesa-logo.webp"}
      />
      <div className="flex items-center gap-2">
        <CartCount />
        <ToggleDarkMode />
      </div>
    </header>
  )
}
