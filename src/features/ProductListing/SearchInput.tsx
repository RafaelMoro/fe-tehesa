"use client"
import { FieldError, Input, Label, TextField } from "@heroui/react"

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
      <TextField name="search" type="text">
        <Label>Buscar producto</Label>
        <Input
          placeholder="Buscar producto"
          value={value}
          onChange={handleChange}
        />
        <FieldError>Busque un producto</FieldError>
      </TextField>
    </div>
  )
}
