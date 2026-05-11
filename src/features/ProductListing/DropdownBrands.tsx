import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
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
      <DropdownTrigger>
        <Button variant="bordered">
          {selectedBrandObj?.name ?? 'Marcas'}
          <RiArrowDownSLine />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Dropdown menu brands"
        onAction={(key) => updateSelectedBrand(key as string)}
      >
        { allBrands.map((brand) => (
          <DropdownItem key={brand.customId}>{brand.name}</DropdownItem>
        )) }
      </DropdownMenu>
    </Dropdown>
  )
}
