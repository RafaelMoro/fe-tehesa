import { useEffect, useState } from "react"
import {
  Button,
  Checkbox,
  Drawer,
  type UseOverlayStateReturn,
} from "@heroui/react"
import { RiCloseLine } from "@remixicon/react"

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
  const [selectedVariantIndexes, setSelectedVariantIndexes] = useState<
    Set<number>
  >(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resetVariants = () => {
    setVariants([])
    setSelectedVariantIndexes(new Set())
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

  const selectedTotal = variants.reduce(
    (total, variant, index) =>
      selectedVariantIndexes.has(index) ? total + variant.price : total,
    0,
  )

  return (
    <Drawer state={state}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right" className="w-full">
          <Drawer.Dialog className="flex h-full flex-col">
            <Drawer.Header className="flex items-start justify-between gap-4 border-b border-default-200 p-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                  Seleccionar variantes
                </p>
                <Drawer.Heading className="mt-2 text-2xl font-bold">
                  {product.name}
                </Drawer.Heading>
              </div>
              <Button
                isIconOnly
                variant="secondary"
                aria-label="Cerrar"
                onPress={handleClose}
              >
                <RiCloseLine />
              </Button>
            </Drawer.Header>
            <Drawer.Body className="flex-1 p-6">
              {isLoading && <p role="status">Cargando variantes...</p>}
              {errorMessage && <p role="alert">{errorMessage}</p>}
              {!isLoading && !errorMessage && variants.length === 0 && (
                <p>No encontramos variantes para este producto.</p>
              )}
              {!isLoading && !errorMessage && variants.length > 0 && (
                <div>
                  <p className="mb-4 text-sm text-muted">
                    Selecciona una o más medidas para agregarlas juntas al
                    carrito.
                  </p>
                  <div className="mb-2 grid grid-cols-[1fr_auto] px-12 text-xs text-muted uppercase">
                    <span>Diámetro</span>
                    <span>Precio</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {variants.map((variant, index) => (
                      <Checkbox
                        key={`${variant.diameter}-${variant.price}`}
                        className="w-full rounded-lg border border-default-200 p-3 data-[selected=true]:border-emerald-700 data-[selected=true]:bg-emerald-50 dark:data-[selected=true]:bg-emerald-950/20"
                        isSelected={selectedVariantIndexes.has(index)}
                        onChange={(isSelected) => {
                          setSelectedVariantIndexes((current) => {
                            const next = new Set(current)
                            if (isSelected) {
                              next.add(index)
                            } else {
                              next.delete(index)
                            }
                            return next
                          })
                        }}
                      >
                        <Checkbox.Content className="flex w-full items-center gap-3">
                          <Checkbox.Control className="shrink-0">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <span className="flex-1 font-medium">
                            {variant.diameter}
                          </span>
                          <span className="text-muted">
                            {variant.priceFormatted}
                          </span>
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </div>
              )}
            </Drawer.Body>
            <Drawer.Footer className="flex-col gap-4 border-t border-default-200 p-6">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm text-muted">
                  {selectedVariantIndexes.size} seleccionada
                  {selectedVariantIndexes.size === 1 ? "" : "s"}
                </span>
                <span className="text-xl font-bold">
                  {formatNumberToCurrency(selectedTotal)}
                </span>
              </div>
              <Button
                fullWidth
                variant="primary"
                onPress={handleClose}
                isDisabled={selectedVariantIndexes.size === 0}
              >
                {selectedVariantIndexes.size === 0
                  ? "Agregar al carrito"
                  : `Agregar ${selectedVariantIndexes.size} al carrito`}
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
