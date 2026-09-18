"use client"
import Link from "next/link"
import { Accordion, Button, Drawer, useOverlayState } from "@heroui/react"
import { RiArrowRightLine, RiCloseLine, RiMenuLine } from "@remixicon/react"

import { ToggleDarkMode } from "../atoms/ToggleDarkMode"
import { CATEGORY_PAGE_HREFS } from "@/shared/constants/category.constants"
import type { TaxonomyItem } from "@/shared/types/global.types"

interface MobileMenuProps {
  categories: TaxonomyItem[]
  brands: TaxonomyItem[]
  isCatalog: boolean
  isCategories: boolean
  categoriesAllHref?: string
  isBrands: boolean
  brandsAllHref?: string
  activeCategory: string | null
  activeBrand: string | null
  whatsappUrl: string | null
}

interface TaxonomyAccordionSectionProps {
  id: string
  label: string
  items: TaxonomyItem[]
  activeName: string | null
  allHref?: string
  allLabel?: string
  isActiveRoute?: boolean
  hrefs?: Record<string, string>
  onNavigate: () => void
}

const TaxonomyAccordionSection = ({
  id,
  label,
  items,
  activeName,
  allHref,
  allLabel,
  isActiveRoute,
  hrefs = {},
  onNavigate,
}: TaxonomyAccordionSectionProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <Accordion.Item id={id} className="border-b border-default-200 dark:border-[#1E3608]">
      <Accordion.Heading>
        <Accordion.Trigger
          className={`flex min-h-[52px] w-full items-center justify-between px-1 text-sm font-medium ${
            isActiveRoute
              ? "bg-[#F5FFEF] text-[#125D03] shadow-[inset_3px_0_0_#4DF527] dark:bg-[#16300A] dark:text-[#B4FE99]"
              : ""
          }`}
        >
          {label}
          {isActiveRoute && <span className="sr-only"> (actual)</span>}
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>
          <ul>
            {items.map((item) => {
              const href = hrefs[item.customId]
              const isActive = item.name === activeName
              const rowClassName = `block min-h-[46px] leading-[1.3] py-2 ${
                isActive
                  ? "bg-[#F5FFEF] text-[#125D03] dark:bg-[#16300A] dark:text-[#B4FE99]"
                  : ""
              }`

              return (
                <li key={item.customId}>
                  {href !== undefined ? (
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={rowClassName}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      aria-current={isActive ? "page" : undefined}
                      className={rowClassName}
                    >
                      {item.name}
                    </span>
                  )}
                </li>
              )
            })}
            {allHref !== undefined && (
              <li>
                <Link
                  href={allHref}
                  onClick={onNavigate}
                  className="mt-1 flex min-h-11 items-center justify-between border-t border-default-200 bg-[#F5FFEF] px-1 font-medium text-[#125D03] dark:border-[#1E3608] dark:bg-[#12250A] dark:text-[#4DF527]"
                >
                  {allLabel}
                  <RiArrowRightLine aria-hidden="true" className="size-4" />
                </Link>
              </li>
            )}
          </ul>
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  )
}

export const MobileMenu = ({
  categories,
  brands,
  isCatalog,
  isCategories,
  categoriesAllHref,
  isBrands,
  brandsAllHref,
  activeCategory,
  activeBrand,
  whatsappUrl,
}: MobileMenuProps) => {
  const state = useOverlayState()

  return (
    <>
      <Button
        isIconOnly
        aria-label="Menú"
        aria-expanded={state.isOpen}
        onPress={state.open}
        className="size-11 rounded-full bg-[#4DF527] text-[#0D3401] hover:bg-[#3BD11A]"
      >
        <RiMenuLine className="size-5" />
      </Button>
      <Drawer state={state}>
        <Drawer.Backdrop className="bg-black/55 dark:bg-black/65">
          <Drawer.Content placement="right" className="w-full max-w-[320px]">
            <Drawer.Dialog className="bg-background text-foreground">
              <Drawer.Header className="items-start border-b border-default-200 px-6 py-6 dark:border-[#1E3608]">
                <Drawer.Heading className="text-xl font-bold">Menú</Drawer.Heading>
                <Drawer.CloseTrigger
                  aria-label="Cerrar"
                  className="size-11 rounded-lg border border-default-200 p-2 text-muted hover:bg-default"
                >
                  <RiCloseLine className="size-5" />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="px-6 py-6">
                <Link
                  href="/"
                  aria-current={isCatalog ? "page" : undefined}
                  onClick={state.close}
                  className="flex min-h-[52px] items-center text-sm font-medium"
                >
                  Productos
                </Link>
                <Accordion>
                  <TaxonomyAccordionSection
                    id="categorias"
                    label="Categorías"
                    items={categories}
                    activeName={activeCategory}
                    allHref={categoriesAllHref}
                    allLabel="Ver todas las categorías"
                    isActiveRoute={isCategories}
                    hrefs={CATEGORY_PAGE_HREFS}
                    onNavigate={state.close}
                  />
                  <TaxonomyAccordionSection
                    id="marcas"
                    label="Marcas"
                    items={brands}
                    activeName={activeBrand}
                    allHref={brandsAllHref}
                    allLabel="Ver todas las marcas"
                    isActiveRoute={isBrands}
                    onNavigate={state.close}
                  />
                </Accordion>
              </Drawer.Body>
              <Drawer.Footer className="flex-col gap-3 border-t border-default-200 px-6 py-5 dark:border-[#1E3608]">
                {whatsappUrl !== null && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[#4DF527] px-4 font-semibold text-[#0D3401]"
                  >
                    Solicitar cotización
                  </a>
                )}
                <ToggleDarkMode showLabel />
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  )
}
