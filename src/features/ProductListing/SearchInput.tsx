"use client"
import { Input, Label, TextField } from "@heroui/react"

interface SearchInputProps {
  value: string
  onSearch: (searchTerm: string) => void
  isDisabled?: boolean
}

export const SearchInput = ({
  value,
  onSearch,
  isDisabled = false,
}: SearchInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  return (
    <div className="w-full lg:flex-1">
      <TextField isDisabled={isDisabled} name="local-search" type="text">
        <Label className="sr-only">Filtrar resultados visibles</Label>
        <Input
          placeholder="Buscar tornillos, tuercas, herramientas..."
          value={value}
          onChange={handleChange}
        />
      </TextField>
    </div>
  )
}
