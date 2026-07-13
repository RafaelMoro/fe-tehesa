import { Button, Dropdown, Label } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { TaxonomyItem } from "@/shared/types/global.types"

interface DropdownBrandsProps {
  selectedBrand: string | null
  updateSelectedBrand: (brandValue: string) => void
  brands: TaxonomyItem[]
  defaultLabel?: string
  valueKey?: "customId" | "name"
  isDisabled?: boolean
  fullWidth?: boolean
}

export const DropdownBrands = ({
  selectedBrand,
  updateSelectedBrand,
  brands,
  defaultLabel,
  valueKey = "customId",
  isDisabled = false,
  fullWidth = false,
}: DropdownBrandsProps) => {
  const selectedBrandObj = brands.find(
    (brand) => brand[valueKey] === selectedBrand,
  )

  return (
    <Dropdown>
      <Button
        className={fullWidth ? "w-full justify-between" : "w-full justify-between sm:w-48"}
        variant="secondary"
        isDisabled={isDisabled}
      >
        {selectedBrandObj?.name ??
          defaultLabel ??
          "Buscar marca en todo el catálogo"}
        <RiArrowDownSLine />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label="Dropdown menu brands"
          onAction={(key) => updateSelectedBrand(key as string)}
        >
          {brands.map((brand) => (
            <Dropdown.Item
              key={brand[valueKey]}
              id={brand[valueKey]}
              textValue={brand.name}
            >
              <Label>{brand.name}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
