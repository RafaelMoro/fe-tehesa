import { Button, Dropdown, Label } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { BRANDS_PRODUCTS } from "@/shared/types/global.types"

interface DropdownBrandsProps {
  selectedBrand: string | null
  updateSelectedBrand: (brandCustomId: string) => void
}

export const DropdownBrands = ({ selectedBrand, updateSelectedBrand }: DropdownBrandsProps) => {
  const allBrands = [...BRANDS_PRODUCTS]
  
  // Find the selected brand object to display its name
  const selectedBrandObj = allBrands.find((brand) => brand.customId === selectedBrand)

  return (
    <Dropdown>
      <Button variant="secondary">
        {selectedBrandObj?.name ?? 'Marcas'}
        <RiArrowDownSLine />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label="Dropdown menu brands"
          onAction={(key) => updateSelectedBrand(key as string)}
        >
          { allBrands.map((brand) => (
            <Dropdown.Item key={brand.customId} id={brand.customId} textValue={brand.name}>
              <Label>{brand.name}</Label>
            </Dropdown.Item>
          )) }
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
