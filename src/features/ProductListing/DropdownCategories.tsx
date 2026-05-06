import { CategoriesList, CATEGORIES_PRODUCTS } from "@/shared/types/global.types"
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

interface DropdownCategoriesProps {
  updateSelectedCategory: (newCategory: CategoriesList) => void
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
      <DropdownMenu aria-label="Dropdown menu categories" onAction={(key) => updateSelectedCategory(key as CategoriesList)}>
        { allCategories.map((category) => (
          <DropdownItem key={category}>{category}</DropdownItem>
        )) }
      </DropdownMenu>
    </Dropdown>
  )
}