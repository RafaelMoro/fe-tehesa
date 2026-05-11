import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { CATEGORIES_PRODUCTS } from "@/shared/types/global.types"

interface DropdownCategoriesProps {
  updateSelectedCategory: (categoryCustomId: string) => void
}

export const DropdownCategories = ({ updateSelectedCategory }: DropdownCategoriesProps) => {
  const allCategories = [...CATEGORIES_PRODUCTS]

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="bordered">
          Categorias
          <RiArrowDownSLine />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Dropdown menu categories" onAction={(key) => updateSelectedCategory(key as string)}>
        { allCategories.map((category) => (
          <DropdownItem key={category.customId}>{category.name}</DropdownItem>
        )) }
      </DropdownMenu>
    </Dropdown>
  )
}