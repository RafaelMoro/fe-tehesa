import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { CATEGORIES_PRODUCTS } from "@/shared/types/global.types"

interface DropdownCategoriesProps {
  selectedCategory: string | null
  updateSelectedCategory: (categoryCustomId: string) => void
}

export const DropdownCategories = ({ selectedCategory, updateSelectedCategory }: DropdownCategoriesProps) => {
  const allCategories = [...CATEGORIES_PRODUCTS]
  
  // Find the selected category object to display its name
  const selectedCategoryObj = allCategories.find((cat) => cat.customId === selectedCategory)

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="bordered">
          {selectedCategoryObj?.name ?? 'Categorias'}
          <RiArrowDownSLine />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Dropdown menu categories"
        onAction={(key) => updateSelectedCategory(key as string)}
      >
        { allCategories.map((category) => (
          <DropdownItem key={category.customId}>{category.name}</DropdownItem>
        )) }
      </DropdownMenu>
    </Dropdown>
  )
}