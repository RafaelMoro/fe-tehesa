import { useEffect, useState } from "react"
import {
  Button,
  Checkbox,
  Drawer,
  toast,
  type UseOverlayStateReturn,
} from "@heroui/react"
import { RiCloseLine } from "@remixicon/react"

import {
  CartVariantLine,
  Product,
  ProductVariant,
  ProductVariantUI,
} from "@/shared/types/global.types"
import {
  catalogErrorToSpanish,
  fetchCatalog,
} from "@/shared/utils/catalog-api.utils"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { CART_MAX_LINES } from "@/shared/constants/cart.constants"
import { useCartStore } from "@/zustand/provider/cart.provider"
import { QuantityStepper } from "@/shared/ui/atoms/QuantityStepper"

interface ProductVariantsDrawerProps {
  product: Product
  state: UseOverlayStateReturn
}

export const ProductVariantsDrawer = ({
  product,
  state,
}: ProductVariantsDrawerProps) => {
  const addVariantLines = useCartStore((store) => store.addVariantLines)
  const [variants, setVariants] = useState<ProductVariantUI[]>([])
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  )
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resetVariants = () => {
    setVariants([])
    setSelectedVariantIds(new Set())
    setQuantities({})
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
            documentId: variant.documentId,
            internalId: variant.internalId,
            diameter: variant.diameter,
            price: variant.pricing.price,
            priceFormatted: formatNumberToCurrency(variant.pricing.price),
          }))
          .sort((a, b) => a.price - b.price)
        setVariants(formattedData)
        setQuantities(
          Object.fromEntries(
            formattedData.map((variant) => [variant.documentId, 1]),
          ),
        )
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

  const handleAdd = () => {
    const inputs: CartVariantLine[] = variants
      .filter((variant) => selectedVariantIds.has(variant.documentId))
      .map((variant) => ({
        productDocumentId: product.documentId,
        productName: product.name,
        variantDocumentId: variant.documentId,
        internalId: variant.internalId,
        diameter: variant.diameter,
        unitPrice: variant.price,
        quantity: quantities[variant.documentId] ?? 1,
      }))

    const result = addVariantLines(inputs)

    if (result.rejected) {
      toast.danger(`Tu lista llegó al máximo de ${CART_MAX_LINES} productos.`)
      return
    }

    const message =
      result.added > 0
        ? `${result.added} variante${result.added === 1 ? "" : "s"} agregada${
            result.added === 1 ? "" : "s"
          }`
        : "Cantidad actualizada"
    toast.success(message)
    handleClose()
  }

  const selectedTotal = variants.reduce(
    (total, variant) =>
      selectedVariantIds.has(variant.documentId)
        ? total + variant.price * (quantities[variant.documentId] ?? 1)
        : total,
    0,
  )
  const selectedPieces = variants.reduce(
    (total, variant) =>
      selectedVariantIds.has(variant.documentId)
        ? total + (quantities[variant.documentId] ?? 1)
        : total,
    0,
  )

  return (
    <Drawer state={state}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right" className="w-full">
          <Drawer.Dialog className="flex h-full flex-col md:w-[440px]! lg:w-[520px]!">
            <Drawer.Header className="flex items-start justify-between gap-4 border-b border-default-200 p-6">
              <div className="w-full flex justify-end">
                <Button
                  isIconOnly
                  variant="secondary"
                  aria-label="Cerrar"
                  onPress={handleClose}
                >
                  <RiCloseLine />
                </Button>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                  Seleccionar variantes
                </p>
                <Drawer.Heading className="mt-2 text-2xl font-bold">
                  {product.name}
                </Drawer.Heading>
              </div>
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
                    Selecciona una o más medidas e indica cuántas piezas
                    necesitas de cada una.
                  </p>
                  <div className="mb-2 grid grid-cols-[1fr_70px_auto] gap-3 px-12 text-xs text-muted uppercase">
                    <span>Diámetro</span>
                    <span>Cantidad</span>
                    <span>Precio</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.documentId}
                        className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border p-3 ${
                          selectedVariantIds.has(variant.documentId)
                            ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
                            : "border-default-200"
                        }`}
                      >
                        <Checkbox
                          aria-label={`Seleccionar ${variant.diameter}`}
                          isSelected={selectedVariantIds.has(variant.documentId)}
                          onChange={(isSelected) => {
                            setSelectedVariantIds((current) => {
                              const next = new Set(current)
                              if (isSelected) {
                                next.add(variant.documentId)
                              } else {
                                next.delete(variant.documentId)
                              }
                              return next
                            })
                          }}
                        >
                          <Checkbox.Content>
                          <Checkbox.Control className="shrink-0">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                        </Checkbox>
                        <span className="font-medium">{variant.diameter}</span>
                        <QuantityStepper
                          label={`Cantidad de ${variant.diameter}`}
                          value={quantities[variant.documentId] ?? 1}
                          onChange={(quantity) => {
                            setQuantities((current) => ({
                              ...current,
                              [variant.documentId]: quantity,
                            }))
                          }}
                        />
                        <span className="text-muted">{variant.priceFormatted}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Drawer.Body>
            <Drawer.Footer className="flex-col gap-4 border-t border-default-200 p-6">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm text-muted">
                  {selectedVariantIds.size} variante
                  {selectedVariantIds.size === 1 ? "" : "s"} · {selectedPieces} pieza
                  {selectedPieces === 1 ? "" : "s"}
                </span>
                <span className="text-xl font-bold">
                  {formatNumberToCurrency(selectedTotal)}
                </span>
              </div>
              <Button
                fullWidth
                variant="primary"
                onPress={handleAdd}
                isDisabled={selectedVariantIds.size === 0}
              >
                {selectedVariantIds.size === 0
                  ? "Agregar al carrito"
                  : `Agregar ${selectedVariantIds.size} al carrito`}
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
