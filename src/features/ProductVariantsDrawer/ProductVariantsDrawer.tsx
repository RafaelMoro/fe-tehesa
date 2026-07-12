import { useEffect, useState } from "react"
import {
  Button,
  Drawer,
  Table,
  type UseOverlayStateReturn,
} from "@heroui/react"

import {
  Product,
  ProductVariant,
  ProductVariantUI,
} from "@/shared/types/global.types"
import {
  catalogErrorToSpanish,
  fetchCatalog,
} from "@/shared/utils/catalog-api.utils"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"

interface ProductVariantsDrawerProps {
  product: Product
  state: UseOverlayStateReturn
}

export const ProductVariantsDrawer = ({
  product,
  state,
}: ProductVariantsDrawerProps) => {
  const [variants, setVariants] = useState<ProductVariantUI[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resetVariants = () => {
    setVariants([])
    setIsLoading(false)
    setErrorMessage(null)
  }

  useEffect(() => {
    let isActive = true

    const loadProductData = async () => {
      setVariants([])
      setErrorMessage(null)
      setIsLoading(true)
      try {
        const data = await fetchCatalog<ProductVariant[]>(
          `/api/catalog/variants?documentId=${encodeURIComponent(product.documentId)}`,
        )
        if (!isActive) {
          return
        }
        const formattedData = data
          .map((variant) => ({
            diameter: variant.diameter,
            price: variant.pricing.price,
            priceFormatted: formatNumberToCurrency(variant.pricing.price),
          }))
          .sort((a, b) => a.price - b.price)
        setVariants(formattedData)
      } catch (error) {
        if (!isActive) {
          return
        }
        const code = (error as { code?: string })?.code
        const message = code
          ? catalogErrorToSpanish(code)
          : "No pudimos cargar las variantes. Inténtalo de nuevo."
        setErrorMessage(message)
        console.error("Error fetching product variants:", message)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    if (state.isOpen) {
      loadProductData()
    } else {
      resetVariants()
    }

    return () => {
      isActive = false
    }
  }, [state.isOpen, product.documentId])

  const handleClose = () => {
    resetVariants()
    state.close()
  }

  return (
    <Drawer state={state}>
      <Drawer.Backdrop>
        <Drawer.Content>
          <Drawer.Dialog>
            <Drawer.Header className="flex flex-col gap-1">
              {product.name}
            </Drawer.Header>
            <Drawer.Body>
              {isLoading && <p role="status">Cargando variantes...</p>}
              {errorMessage && <p role="alert">{errorMessage}</p>}
              {!isLoading && !errorMessage && variants.length === 0 && (
                <p>No encontramos variantes para este producto.</p>
              )}
              {!isLoading && !errorMessage && variants.length > 0 && (
                <Table>
                  <Table.Content
                    aria-label={`Variantes del producto ${product.name}`}
                  >
                    <Table.Header>
                      <Table.Column isRowHeader>Variante</Table.Column>
                      <Table.Column>Precio</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {variants.map((variant, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>{variant.diameter}</Table.Cell>
                          <Table.Cell>{variant.priceFormatted}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table>
              )}
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="danger-soft" onPress={handleClose}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={handleClose}>
                Finalizar
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
