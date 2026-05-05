"use client"
import { useState } from "react"
import { Input } from "@heroui/react"

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
      <Input
        errorMessage="Busque un producto"
        label="Buscar producto"
        labelPlacement="outside"
        name="search"
        placeholder="Buscar producto"
        type="text"
        value={searchTerm}
        onChange={handleChange}
      />
    </div>
  )
}