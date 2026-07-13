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
}

export const DropdownBrands = ({
  selectedBrand,
  updateSelectedBrand,
  brands,
  defaultLabel,
  valueKey = "customId",
  isDisabled = false,
}: DropdownBrandsProps) => {
  // Find the selected brand object to display its name
  const selectedBrandObj = brands.find(
    (brand) => brand[valueKey] === selectedBrand,
  )
  const availableBrands = brands.filter(
    (brand) => brand[valueKey] !== selectedBrand,
  )

  return (
    <Dropdown>
      <Button variant="secondary" isDisabled={isDisabled}>
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
          {availableBrands.map((brand) => (
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
