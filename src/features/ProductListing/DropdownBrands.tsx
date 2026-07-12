import { Button, Dropdown, Label } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { TaxonomyItem } from "@/shared/types/global.types"

interface DropdownBrandsProps {
  selectedBrand: string | null
  updateSelectedBrand: (brandCustomId: string) => void
  brands: TaxonomyItem[]
  defaultLabel?: string
}

export const DropdownBrands = ({
  selectedBrand,
  updateSelectedBrand,
  brands,
  defaultLabel,
}: DropdownBrandsProps) => {
  // Find the selected brand object to display its name
  const selectedBrandObj = brands.find(
    (brand) => brand.customId === selectedBrand,
  )
  const availableBrands = brands.filter(
    (brand) => brand.customId !== selectedBrand,
  )

  return (
    <Dropdown>
      <Button variant="secondary">
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
              key={brand.customId}
              id={brand.customId}
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
