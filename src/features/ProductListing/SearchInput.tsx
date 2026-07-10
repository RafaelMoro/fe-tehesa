"use client"
import { useState } from "react"
import { FieldError, Input, Label, TextField } from "@heroui/react"

interface SearchInputProps {
  onSearch: (searchTerm: string) => void
}

export const SearchInput = ({ onSearch }: SearchInputProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    onSearch(e.target.value)
  }

  return (
    <div className="mb-4 max-w-[500px]">
      <TextField name="search" type="text">
        <Label>Buscar producto</Label>
        <Input
          placeholder="Buscar producto"
          value={searchTerm}
          onChange={handleChange}
        />
        <FieldError>Busque un producto</FieldError>
      </TextField>
    </div>
  )
}
