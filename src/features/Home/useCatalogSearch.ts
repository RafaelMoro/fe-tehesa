"use client"
import { useState } from "react"
import { useOverlayState } from "@heroui/react"

type CatalogMessageKind = "status" | "error" | null

export const useCatalogSearch = () => {
  const catalogSearchDrawerState = useOverlayState()
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("")
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null)
  const [catalogMessageKind, setCatalogMessageKind] =
    useState<CatalogMessageKind>(null)
  const [isInvalidCatalogSearch, setIsInvalidCatalogSearch] = useState(false)
  const [invalidSearchMessage, setInvalidSearchMessage] = useState<
    string | null
  >(null)
  const [isLoadingCatalogSearch, setIsLoadingCatalogSearch] = useState(false)

  const handleCatalogSearchTermChange = (term: string) => {
    setCatalogSearchTerm(term)
    if (isInvalidCatalogSearch) {
      setIsInvalidCatalogSearch(false)
      setInvalidSearchMessage(null)
    }
    if (catalogMessage) {
      setCatalogMessage(null)
      setCatalogMessageKind(null)
    }
  }

  const validateCatalogSearchTerm = (): string | null => {
    const trimmed = catalogSearchTerm.trim()
    if (trimmed.length === 0) {
      setIsInvalidCatalogSearch(true)
      setInvalidSearchMessage("Ingresa un texto para buscar en el catálogo.")
      return null
    }
    setIsInvalidCatalogSearch(false)
    setInvalidSearchMessage(null)
    setCatalogMessage(null)
    setCatalogMessageKind(null)
    return trimmed
  }

  const clearCatalogSearchInput = () => {
    setCatalogSearchTerm("")
    setCatalogMessage(null)
    setCatalogMessageKind(null)
    setIsInvalidCatalogSearch(false)
    setInvalidSearchMessage(null)
    catalogSearchDrawerState.close()
  }

  const clearAllCatalogState = () => {
    setCatalogSearchTerm("")
    setCatalogMessage(null)
    setCatalogMessageKind(null)
    setIsInvalidCatalogSearch(false)
    setInvalidSearchMessage(null)
    setIsLoadingCatalogSearch(false)
    catalogSearchDrawerState.close()
  }

  return {
    catalogSearchDrawerState,
    catalogSearchTerm,
    catalogMessage,
    catalogMessageKind,
    isInvalidCatalogSearch,
    invalidSearchMessage,
    isLoadingCatalogSearch,
    handleCatalogSearchTermChange,
    validateCatalogSearchTerm,
    clearCatalogSearchInput,
    clearAllCatalogState,
  }
}
