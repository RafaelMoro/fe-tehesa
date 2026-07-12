"use client"
import { useEffect, useState } from "react"
import { useOverlayState } from "@heroui/react"

import { Product } from "@/shared/types/global.types"
import {
  catalogErrorToSpanish,
  fetchCatalog,
} from "@/shared/utils/catalog-api.utils"

export type CatalogMode = "name" | "category" | "brand" | null

export type CatalogMessageKind = "status" | "error" | null

interface UseCatalogSearchArgs {
  products: Product[]
}

export const useCatalogSearch = ({ products }: UseCatalogSearchArgs) => {
  const catalogSearchDrawerState = useOverlayState()
  const [activeCatalogMode, setActiveCatalogMode] = useState<CatalogMode>(null)
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("")
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null)
  const [catalogMessageKind, setCatalogMessageKind] =
    useState<CatalogMessageKind>(null)
  const [isInvalidCatalogSearch, setIsInvalidCatalogSearch] = useState(false)
  const [invalidSearchMessage, setInvalidSearchMessage] = useState<
    string | null
  >(null)
  const [isLoadingCatalogSearch, setIsLoadingCatalogSearch] = useState(false)

  useEffect(() => {
    setActiveCatalogMode(null)
    setCatalogSearchTerm("")
    setCatalogMessage(null)
    setCatalogMessageKind(null)
    setIsInvalidCatalogSearch(false)
    setInvalidSearchMessage(null)
    setIsLoadingCatalogSearch(false)
  }, [products])

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

  const handleCatalogNameSearch = async (
    page = 1,
  ): Promise<Product[] | null> => {
    const trimmed = catalogSearchTerm.trim()
    if (trimmed.length === 0) {
      setIsInvalidCatalogSearch(true)
      setInvalidSearchMessage("Ingresa un texto para buscar en el catálogo.")
      return null
    }
    setIsLoadingCatalogSearch(true)
    setIsInvalidCatalogSearch(false)
    setInvalidSearchMessage(null)
    setCatalogMessage("Buscando productos en el catálogo...")
    setCatalogMessageKind("status")
    try {
      const results = await fetchCatalog<Product[]>(
        `/api/catalog/search?q=${encodeURIComponent(trimmed)}&page=${page}`,
      )
      setActiveCatalogMode("name")
      if (results.length === 0) {
        setCatalogMessage("No encontramos productos en el catálogo.")
        setCatalogMessageKind("status")
      } else {
        setCatalogMessage(null)
        setCatalogMessageKind(null)
      }
      catalogSearchDrawerState.close()
      return results
    } catch (error) {
      const code = (error as { code?: string })?.code
      if (code === "CAT_VAL_006") {
        setIsInvalidCatalogSearch(true)
        setInvalidSearchMessage(
          "Revisa el texto de búsqueda e inténtalo de nuevo.",
        )
      } else {
        setCatalogMessage(
          code
            ? catalogErrorToSpanish(code)
            : "No pudimos buscar productos. Inténtalo de nuevo.",
        )
        setCatalogMessageKind("error")
      }
      return null
    } finally {
      setIsLoadingCatalogSearch(false)
    }
  }

  // ponytail: single helper to coordinate catalog-wide category/brand selection
  // with the search state (clears the search box, dismisses any prior message, closes the drawer).
  const beginCatalogMode = (mode: "category" | "brand") => {
    setActiveCatalogMode(mode)
    setCatalogSearchTerm("")
    setCatalogMessage(null)
    setCatalogMessageKind(null)
    setIsInvalidCatalogSearch(false)
    setInvalidSearchMessage(null)
    catalogSearchDrawerState.close()
  }

  const clearAllCatalogState = () => {
    setActiveCatalogMode(null)
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
    activeCatalogMode,
    catalogSearchTerm,
    catalogMessage,
    catalogMessageKind,
    isInvalidCatalogSearch,
    invalidSearchMessage,
    isLoadingCatalogSearch,
    handleCatalogSearchTermChange,
    handleCatalogNameSearch,
    beginCatalogMode,
    clearAllCatalogState,
  }
}
