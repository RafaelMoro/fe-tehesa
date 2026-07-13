import { DropdownBrands } from "@/features/ProductListing/DropdownBrands"
import { DropdownCategories } from "@/features/ProductListing/DropdownCategories"
import { SearchInput } from "@/features/ProductListing/SearchInput"

export const CatalogDisabledFilters = () => (
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
)
