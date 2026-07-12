import { Button, Dropdown, Label } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { TaxonomyItem } from "@/shared/types/global.types"

interface DropdownCategoriesProps {
  selectedCategory: string | null
  updateSelectedCategory: (categoryCustomId: string) => void
  categories: TaxonomyItem[]
  defaultLabel?: string
}

export const DropdownCategories = ({ selectedCategory, updateSelectedCategory, categories, defaultLabel }: DropdownCategoriesProps) => {
  // Find the selected category object to display its name
  const selectedCategoryObj = categories.find((cat) => cat.customId === selectedCategory)

  return (
    <Dropdown>
      <Button variant="secondary">
        {selectedCategoryObj?.name ?? defaultLabel ?? 'Buscar categoría en todo el catálogo'}
        <RiArrowDownSLine />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label="Dropdown menu categories"
          onAction={(key) => updateSelectedCategory(key as string)}
        >
          { categories.map((category) => (
            <Dropdown.Item key={category.customId} id={category.customId} textValue={category.name}>
              <Label>{category.name}</Label>
            </Dropdown.Item>
          )) }
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
