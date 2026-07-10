import { Button, Dropdown, Label } from "@heroui/react"
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
      <Button variant="secondary">
        {selectedCategoryObj?.name ?? 'Categorias'}
        <RiArrowDownSLine />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label="Dropdown menu categories"
          onAction={(key) => updateSelectedCategory(key as string)}
        >
          { allCategories.map((category) => (
            <Dropdown.Item key={category.customId} id={category.customId} textValue={category.name}>
              <Label>{category.name}</Label>
            </Dropdown.Item>
          )) }
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
