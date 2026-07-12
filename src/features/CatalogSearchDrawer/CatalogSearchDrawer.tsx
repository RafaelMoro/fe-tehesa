"use client"
import {
  Button,
  Description,
  Drawer,
  FieldError,
  Input,
  Label,
  Spinner,
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
  onCategorySelect: (categoryId: string) => void
  onBrandSelect: (brandId: string) => void
  selectedCategory: string | null
  selectedBrand: string | null
  categories: TaxonomyItem[]
  brands: TaxonomyItem[]
  isLoading: boolean
  message?: string | null
  isInvalidSearch?: boolean
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
  isInvalidSearch,
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
                      Revisa el texto de búsqueda e inténtalo de nuevo.
                    </FieldError>
                  ) : (
                    <Description>
                      Busca coincidencias por nombre en el catálogo.
                    </Description>
                  )}
                </TextField>
                <Button type="submit" isPending={isLoading}>
                  Buscar
                </Button>
              </form>
              <div className="mt-5 flex flex-col gap-3">
                <span className="text-sm font-medium">O busca por</span>
                <DropdownCategories
                  selectedCategory={selectedCategory}
                  updateSelectedCategory={onCategorySelect}
                  categories={categories}
                  defaultLabel="Buscar categoría en todo el catálogo"
                />
                <DropdownBrands
                  selectedBrand={selectedBrand}
                  updateSelectedBrand={onBrandSelect}
                  brands={brands}
                  defaultLabel="Buscar marca en todo el catálogo"
                />
              </div>
              {isLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Spinner size="sm" />
                  <span>Buscando productos en el catálogo...</span>
                </div>
              ) : message ? (
                <p className="mt-4 text-sm">{message}</p>
              ) : null}
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="tertiary" onPress={onClearCatalogSearch}>
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
