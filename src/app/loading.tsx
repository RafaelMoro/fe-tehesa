import { CatalogHero } from "@/features/Home/CatalogHero"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"
import { DropdownBrands } from "@/features/ProductListing/DropdownBrands"
import { DropdownCategories } from "@/features/ProductListing/DropdownCategories"
import { SearchInput } from "@/features/ProductListing/SearchInput"

export default function Loading() {
  return (
    <CatalogPageLayout themeFetched="light">
      <CatalogHero isDisabled />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <SearchInput isDisabled value="" onSearch={() => {}} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <DropdownCategories
            isDisabled
            categories={[]}
            selectedCategory={null}
            updateSelectedCategory={() => {}}
            defaultLabel="Filtrar categorías"
          />
          <DropdownBrands
            isDisabled
            brands={[]}
            selectedBrand={null}
            updateSelectedBrand={() => {}}
            defaultLabel="Filtrar marcas"
          />
        </div>
      </div>
      <p className="sr-only" role="status">
        Cargando productos...
      </p>
    </CatalogPageLayout>
  )
}
