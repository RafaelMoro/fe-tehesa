"use client"
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Drawer state={state}>
      <Drawer.Backdrop>
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.Header>
              <Drawer.Heading>Buscar en todo el catálogo</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  isInvalid={isInvalidSearch}
                  name="catalog-search"
                  type="text"
                  value={searchTerm}
                  onChange={onSearchTermChange}
                >
                  <Label>Nombre del producto</Label>
                  <Input placeholder="Ej. Llave allen" variant="secondary" />
                  {isInvalidSearch ? (
                    <FieldError>
                      {invalidSearchMessage ??
                        "Revisa el texto de búsqueda e inténtalo de nuevo."}
                    </FieldError>
                  ) : (
                    <Description>
                      Busca coincidencias por nombre en el catálogo.
                    </Description>
                  )}
                </TextField>
                <Button type="submit" isPending={isLoading} isDisabled={isLoading}>
                  Buscar
                </Button>
              </form>
              <div className="mt-5 flex flex-col gap-3">
                <span className="text-sm font-medium">O busca por</span>
                <div className="flex flex-col gap-1">
                  <Label>Categoría</Label>
                  <DropdownCategories
                    selectedCategory={selectedCategory}
                    updateSelectedCategory={onCategorySelect}
                    categories={categories}
                    defaultLabel="Buscar categoría en todo el catálogo"
                    valueKey="name"
                    isDisabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Marca</Label>
                  <DropdownBrands
                    selectedBrand={selectedBrand}
                    updateSelectedBrand={onBrandSelect}
                    brands={brands}
                    defaultLabel="Buscar marca en todo el catálogo"
                    valueKey="name"
                    isDisabled={isLoading}
                  />
                </div>
              </div>
              {message ? (
                <p
                  className="mt-4 text-sm"
                  role={messageKind === "error" ? "alert" : "status"}
                >
                  {message}
                </p>
              ) : null}
            </Drawer.Body>
            <Drawer.Footer>
              <Button
                variant="tertiary"
                onPress={onClearCatalogSearch}
                isDisabled={isLoading}
              >
                Limpiar búsqueda
              </Button>
              <Button slot="close" variant="secondary">
                Cerrar
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
