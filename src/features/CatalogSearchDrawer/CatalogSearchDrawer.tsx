"use client"
import { useState } from "react"
import {
  Button,
  Description,
  Drawer,
  FieldError,
  Input,
  Label,
  TextField,
  type UseOverlayStateReturn,
} from "@heroui/react"
import { RiCloseLine, RiSearchLine } from "@remixicon/react"

import { DropdownCategories } from "@/features/ProductListing/DropdownCategories"
import { DropdownBrands } from "@/features/ProductListing/DropdownBrands"
import { TaxonomyItem } from "@/shared/types/global.types"

interface CatalogSearchDrawerProps {
  state: UseOverlayStateReturn
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onSubmit: () => void
  onCategorySelect: (categoryName: string) => void
  onBrandSelect: (brandName: string) => void
  selectedCategory: string | null
  selectedBrand: string | null
  categories: TaxonomyItem[]
  brands: TaxonomyItem[]
  isLoading: boolean
  message?: string | null
  messageKind?: "status" | "error" | null
  isInvalidSearch?: boolean
  invalidSearchMessage?: string | null
  onClearCatalogSearch: () => void
}

type SearchMode = "product" | "category" | "brand"

const searchModes: { id: SearchMode; label: string }[] = [
  { id: "product", label: "Producto" },
  { id: "category", label: "Categoría" },
  { id: "brand", label: "Marca" },
]

const frequentSearches = ["Broca de cobalto", "Dado tarraja", "Llave Allen"]

export const CatalogSearchDrawer = ({
  state,
  searchTerm,
  onSearchTermChange,
  onSubmit,
  onCategorySelect,
  onBrandSelect,
  selectedCategory,
  selectedBrand,
  categories,
  brands,
  isLoading,
  message,
  messageKind,
  isInvalidSearch,
  invalidSearchMessage,
  onClearCatalogSearch,
}: CatalogSearchDrawerProps) => {
  const [searchMode, setSearchMode] = useState<SearchMode>("product")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Drawer state={state}>
      <Drawer.Backdrop className="bg-black/55 dark:bg-black/65">
        <Drawer.Content className="w-full max-w-[28.75rem]" placement="left">
          <Drawer.Dialog className="bg-background text-foreground">
            <Drawer.Header className="items-start border-b border-default-200 px-6 py-6">
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-xs font-bold tracking-wide text-primary-500 dark:text-primary-200">
                  CATÁLOGO COMPLETO
                </span>
                <Drawer.Heading className="text-2xl font-bold tracking-tight">
                  Búsqueda ampliada
                </Drawer.Heading>
                <p className="max-w-56 text-sm leading-5 text-muted">
                  Encuentra productos fuera de la selección y los filtros actuales.
                </p>
              </div>
              <Drawer.CloseTrigger
                aria-label="Cerrar búsqueda ampliada"
                className="rounded-lg border border-default-200 p-2 text-muted hover:bg-default"
              >
                <RiCloseLine className="size-5" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body className="px-6 py-6">
              <p className="mb-3 text-xs font-medium tracking-wide text-muted">BUSCAR POR</p>
              <div className="grid grid-cols-3 rounded-lg bg-default p-1" role="tablist">
                {searchModes.map(({ id, label }) => (
                  <Button
                    key={id}
                    aria-selected={searchMode === id}
                    className="rounded-md text-sm data-[selected=true]:bg-default-100"
                    isDisabled={isLoading}
                    variant={searchMode === id ? "secondary" : "ghost"}
                    onPress={() => setSearchMode(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {searchMode === "product" ? (
                <form className="mt-7 flex flex-col gap-6" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    isInvalid={isInvalidSearch}
                    name="catalog-search"
                    type="text"
                    value={searchTerm}
                    onChange={onSearchTermChange}
                  >
                    <Label className="text-sm font-semibold">Nombre del producto</Label>
                    <div className="relative">
                      <RiSearchLine className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted" />
                      <Input
                        className="h-12 border-primary-400 pl-10 focus-within:border-primary-300"
                        placeholder="Ej. Llave Allen"
                        variant="secondary"
                      />
                    </div>
                    {isInvalidSearch ? (
                      <FieldError>
                        {invalidSearchMessage ?? "Ingresa un texto para buscar en el catálogo."}
                      </FieldError>
                    ) : (
                      <Description>Busca coincidencias por nombre en todo el catálogo.</Description>
                    )}
                  </TextField>
                  <div>
                    <p className="mb-3 text-xs font-medium tracking-wide text-muted">
                      BÚSQUEDAS FRECUENTES
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {frequentSearches.map((term) => (
                        <Button
                          key={term}
                          className="h-8 rounded-full px-3 text-xs"
                          isDisabled={isLoading}
                          variant="outline"
                          onPress={() => onSearchTermChange(term)}
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mt-7 flex flex-col gap-2">
                  <Label className="text-sm font-semibold">
                    {searchMode === "category" ? "Categoría" : "Marca"}
                  </Label>
                  {searchMode === "category" ? (
                  <DropdownCategories
                    selectedCategory={selectedCategory}
                    updateSelectedCategory={onCategorySelect}
                    categories={categories}
                    defaultLabel="Buscar categoría en todo el catálogo"
                    valueKey="name"
                    isDisabled={isLoading}
                  />
                  ) : (
                  <DropdownBrands
                    selectedBrand={selectedBrand}
                    updateSelectedBrand={onBrandSelect}
                    brands={brands}
                    defaultLabel="Buscar marca en todo el catálogo"
                    valueKey="name"
                    isDisabled={isLoading}
                  />
                  )}
                  <Description>
                    Selecciona una {searchMode === "category" ? "categoría" : "marca"} para ver
                    todos sus productos.
                  </Description>
                </div>
              )}
              {message ? (
                <p
                  className="mt-4 text-sm"
                  role={messageKind === "error" ? "alert" : "status"}
                >
                  {message}
                </p>
              ) : null}
            </Drawer.Body>
            <Drawer.Footer className="flex-col gap-3 border-t border-default-200 px-6 py-5 sm:flex-row">
              <Button
                className="order-2 self-start px-0 text-xs underline sm:order-1"
                variant="tertiary"
                onPress={onClearCatalogSearch}
                isDisabled={isLoading}
              >
                Limpiar búsqueda
              </Button>
              {searchMode === "product" ? (
                <Button
                  className="order-1 h-12 w-full sm:order-2"
                  isDisabled={isLoading}
                  isPending={isLoading}
                  onPress={onSubmit}
                >
                  <RiSearchLine className="size-4" />
                  Buscar en todo el catálogo
                </Button>
              ) : null}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
