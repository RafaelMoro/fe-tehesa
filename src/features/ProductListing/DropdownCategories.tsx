import { Button, Dropdown, Label } from "@heroui/react"
import { RiArrowDownSLine } from "@remixicon/react"

import { TaxonomyItem } from "@/shared/types/global.types"

interface DropdownCategoriesProps {
  selectedCategory: string | null
  updateSelectedCategory: (categoryValue: string) => void
  categories: TaxonomyItem[]
  defaultLabel?: string
  valueKey?: "customId" | "name"
  isDisabled?: boolean
  fullWidth?: boolean
}

export const DropdownCategories = ({
  selectedCategory,
  updateSelectedCategory,
  categories,
  defaultLabel,
  valueKey = "customId",
  isDisabled = false,
  fullWidth = false,
}: DropdownCategoriesProps) => {
  const selectedCategoryObj = categories.find(
    (cat) => cat[valueKey] === selectedCategory,
  )

  return (
    <Dropdown>
      <Button
        className={fullWidth ? "w-full justify-between" : "w-full justify-between sm:w-48"}
        variant="secondary"
        isDisabled={isDisabled}
      >
        {selectedCategoryObj?.name ??
          defaultLabel ??
          "Buscar categoría en todo el catálogo"}
        <RiArrowDownSLine />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label="Dropdown menu categories"
          onAction={(key) => updateSelectedCategory(key as string)}
        >
          {categories.map((category) => (
            <Dropdown.Item
              key={category[valueKey]}
              id={category[valueKey]}
              textValue={category.name}
            >
              <Label>{category.name}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
