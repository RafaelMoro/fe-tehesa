import { Categories, CATEGORIES_PRODUCTS, categoriesDict } from "@/shared/types/global.types"
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

interface DropdownCategoriesProps {
  updateSelectedCategory: (newCategory: Categories) => void
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
      <DropdownMenu aria-label="Dropdown menu categories" onAction={(key) => updateSelectedCategory(key as Categories)}>
        { allCategories.map((category) => (
          <DropdownItem key={category}>{categoriesDict[category]}</DropdownItem>
        )) }
      </DropdownMenu>
    </Dropdown>
  )
}