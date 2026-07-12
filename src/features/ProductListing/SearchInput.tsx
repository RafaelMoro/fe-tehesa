"use client"
import { Description, Input, Label, TextField } from "@heroui/react"

interface SearchInputProps {
  value: string
  onSearch: (searchTerm: string) => void
}

export const SearchInput = ({ value, onSearch }: SearchInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  return (
    <div className="mb-4 max-w-[500px]">
      <TextField name="local-search" type="text">
        <Label>Filtrar resultados visibles</Label>
        <Input
          placeholder="Filtra los productos que ya estás viendo"
          value={value}
          onChange={handleChange}
        />
        <Description>Filtra los productos que ya estás viendo.</Description>
      </TextField>
    </div>
  )
}
