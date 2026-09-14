"use client"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button, Dropdown } from "@heroui/react"
import { RiArrowDownSLine, RiArrowRightLine, RiSearchLine } from "@remixicon/react"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"
import { CartCount } from "../atoms/CartCount"
import { MobileMenu } from "./MobileMenu"
import { CATALOG_SEARCH_OPEN_EVENT } from "@/shared/constants/catalog.constants"
import {
  WHATSAPP_HEADER_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/shared/constants/whatsapp.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"
import type { TaxonomyItem } from "@/shared/types/global.types"

interface HeaderProps {
  categories: TaxonomyItem[]
  brands: TaxonomyItem[]
}

interface TaxonomyDropdownProps {
  label: string
  items: TaxonomyItem[]
  activeName: string | null
  menuClassName: string
  allHref?: string
  isActiveRoute?: boolean
}

const TaxonomyDropdown = ({
  label,
  items,
  activeName,
  menuClassName,
  allHref,
  isActiveRoute,
}: TaxonomyDropdownProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <Dropdown>
      <Button
        variant="ghost"
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${
          isActiveRoute ? "border-b-2 border-[#4DF527]" : ""
        }`}
      >
        {label}
        {isActiveRoute && <span className="sr-only"> (actual)</span>}
        <RiArrowDownSLine aria-hidden="true" className="size-4" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu aria-label={label} className={`max-h-[420px] overflow-y-auto ${menuClassName}`}>
          {items.map((item) => {
            const isActive = item.name === activeName
            return (
              <Dropdown.Item
                key={item.customId}
                id={item.name}
                textValue={item.name}
                isDisabled
                className={`min-h-11 leading-[1.3] whitespace-normal ${
                  isActive
                    ? "bg-[#F5FFEF] text-[#125D03] dark:bg-[#16300A] dark:text-[#B4FE99]"
                    : ""
                }`}
              >
                {item.name}
                {isActive && <span className="sr-only"> (actual)</span>}
              </Dropdown.Item>
            )
          })}
          {allHref !== undefined && (
            <Dropdown.Item
              id="ver-todas"
              href={allHref}
              textValue="Ver todas las categorías"
              className="min-h-11 mt-1 flex items-center justify-between border-t border-default-200 bg-[#F5FFEF] font-medium text-[#125D03] dark:border-[#1E3608] dark:bg-[#12250A] dark:text-[#4DF527] dark:hover:text-[#B4FE99]"
            >
              Ver todas las categorías
              <RiArrowRightLine aria-hidden="true" className="size-4" />
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

export const Header = ({ categories, brands }: HeaderProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCatalog = pathname === "/"
  const isCategories = pathname === "/categorias"
  const activeCategory =
    searchParams.get("mode") === "category" ? searchParams.get("category") : null
  const activeBrand =
    searchParams.get("mode") === "brand" ? searchParams.get("brand") : null
  const whatsappUrl = WHATSAPP_NUMBER
    ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-default-200 bg-white dark:border-[#1E3608] dark:bg-[#0B1A02]">
      <div className="flex min-h-11 items-center justify-center gap-2 bg-[#0F2001] px-4 py-2 text-center text-xs text-white md:min-h-0">
        <span className="hidden lg:inline">
          Soluciones para ferretería e instalación industrial · ¿Necesitas una medida especial?
        </span>
        <span className="lg:hidden">¿Medida especial?</span>
        {whatsappUrl !== null && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            <span className="hidden lg:inline">Solicitar cotización</span>
            <span className="lg:hidden">Cotizar</span>
          </a>
        )}
      </div>
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Tehesa, inicio" className="flex items-center gap-2">
          <span aria-hidden="true" className="h-6 w-[3px] bg-[#4DF527]" />
          <span className="text-lg font-bold">Tehesa</span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            aria-current={isCatalog ? "page" : undefined}
            className={`px-3 py-2 text-sm font-medium ${
              isCatalog ? "border-b-2 border-[#4DF527]" : ""
            }`}
          >
            Productos
          </Link>
          <TaxonomyDropdown
            label="Categorías"
            items={categories}
            activeName={activeCategory}
            menuClassName="w-[350px]"
            allHref={isCategories ? undefined : "/categorias"}
            isActiveRoute={isCategories}
          />
          <TaxonomyDropdown
            label="Marcas"
            items={brands}
            activeName={activeBrand}
            menuClassName="w-[220px]"
          />
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          {isCatalog && (
            <Button
              isIconOnly
              aria-label="Buscar"
              className="size-11"
              onPress={() =>
                window.dispatchEvent(new Event(CATALOG_SEARCH_OPEN_EVENT))
              }
            >
              <RiSearchLine className="size-5" />
            </Button>
          )}
          <CartCount />
          <MobileMenu
            categories={categories}
            brands={brands}
            isCatalog={isCatalog}
            isCategories={isCategories}
            activeCategory={activeCategory}
            activeBrand={activeBrand}
            whatsappUrl={whatsappUrl}
          />
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <CartCount />
          <ToggleDarkMode />
        </div>
      </div>
    </header>
  )
}
