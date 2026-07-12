"use client"
import { useEffect, useState } from "react"
import { useOverlayState } from "@heroui/react"

import { Product } from "@/shared/types/global.types"
import { catalogErrorToSpanish, fetchCatalog } from "@/shared/utils/catalog-api.utils"

export type CatalogMode = 'name' | 'category' | 'brand' | null

interface UseCatalogSearchArgs {
  products: Product[]
}

export const useCatalogSearch = ({ products }: UseCatalogSearchArgs) => {
  const catalogSearchDrawerState = useOverlayState()
  const [activeCatalogMode, setActiveCatalogMode] = useState<CatalogMode>(null)
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("")
  const [catalogMessage, setCatalogMessage] = useState<string | undefined>(undefined)
  const [isInvalidCatalogSearch, setIsInvalidCatalogSearch] = useState(false)
  const [isLoadingCatalogSearch, setIsLoadingCatalogSearch] = useState(false)

  useEffect(() => {
    setActiveCatalogMode(null)
    setCatalogSearchTerm("")
    setCatalogMessage(undefined)
    setIsInvalidCatalogSearch(false)
    setIsLoadingCatalogSearch(false)
  }, [products])

  const handleCatalogSearchTermChange = (term: string) => {
    setCatalogSearchTerm(term)
    if (isInvalidCatalogSearch) setIsInvalidCatalogSearch(false)
    if (catalogMessage) setCatalogMessage(undefined)
  }

  const handleCatalogNameSearch = async (): Promise<Product[] | null> => {
    const trimmed = catalogSearchTerm.trim()
    if (trimmed.length === 0) {
      setIsInvalidCatalogSearch(true)
      setCatalogMessage("Revisa el texto de búsqueda e inténtalo de nuevo.")
      return null
    }
    setIsLoadingCatalogSearch(true)
    setIsInvalidCatalogSearch(false)
    setCatalogMessage("Buscando productos en el catálogo...")
    try {
      const results = await fetchCatalog<Product[]>(
        `/api/catalog/search?q=${encodeURIComponent(trimmed)}`,
      )
      setActiveCatalogMode('name')
      setCatalogSearchTerm("")
      setCatalogMessage(results.length === 0 ? "No encontramos productos en el catálogo." : undefined)
      catalogSearchDrawerState.close()
      return results
    } catch (error) {
      const code = (error as { code?: string })?.code
      if (code === 'CAT_VAL_006') {
        setIsInvalidCatalogSearch(true)
        setCatalogMessage("Revisa el texto de búsqueda e inténtalo de nuevo.")
      } else {
        setCatalogMessage(
          code
            ? catalogErrorToSpanish(code)
            : "No pudimos buscar productos. Inténtalo de nuevo.",
        )
      }
      return null
    } finally {
      setIsLoadingCatalogSearch(false)
    }
  }

  // ponytail: single helper to coordinate catalog-wide category/brand selection
  // with the search state (clears the search box, dismisses any prior message, closes the drawer).
  const beginCatalogMode = (mode: 'category' | 'brand') => {
    setActiveCatalogMode(mode)
    setCatalogSearchTerm("")
    setCatalogMessage(undefined)
    setIsInvalidCatalogSearch(false)
    catalogSearchDrawerState.close()
  }

  const clearAllCatalogState = () => {
    setActiveCatalogMode(null)
    setCatalogSearchTerm("")
    setCatalogMessage(undefined)
    setIsInvalidCatalogSearch(false)
    setIsLoadingCatalogSearch(false)
    catalogSearchDrawerState.close()
  }

  return {
    catalogSearchDrawerState,
    activeCatalogMode,
    catalogSearchTerm,
    catalogMessage,
    isInvalidCatalogSearch,
    isLoadingCatalogSearch,
    handleCatalogSearchTermChange,
    handleCatalogNameSearch,
    beginCatalogMode,
    clearAllCatalogState,
  }
}
