import { useCallback, useEffect, useRef, useState } from "react"
import {
  Button,
  Checkbox,
  Drawer,
  Skeleton,
  toast,
  type UseOverlayStateReturn,
} from "@heroui/react"
import { RiCheckLine, RiCloseLine, RiErrorWarningLine } from "@remixicon/react"

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
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { QuantityStepper } from "@/shared/ui/atoms/QuantityStepper"

const NEUTRAL_SECONDARY_BUTTON_CLASS =
  "border-gray-200! text-gray-900! dark:border-gray-700! dark:text-gray-50!"

// HeroUI's .button is white-space: nowrap with a fixed 40px height, so
// "Agregar N medidas al carrito" overflows the CTA at 320px. Let it wrap and grow.
const WRAPPING_CTA_CLASS = "h-auto! min-h-10 py-2 whitespace-normal!"

interface ProductVariantsDrawerProps {
  product: Product
  state: UseOverlayStateReturn
  initialQuantity?: number
  onConfirmVariant?: (variant: ProductVariantUI, quantity: number) => void
}

export const ProductVariantsDrawer = ({
  product,
  state,
  initialQuantity,
  onConfirmVariant,
}: ProductVariantsDrawerProps) => {
  const isUpgradeMode = onConfirmVariant !== undefined
  const { isMobile } = useMediaQuery()
  const addVariantLines = useCartStore((store) => store.addVariantLines)
  const [variants, setVariants] = useState<ProductVariantUI[]>([])
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  )
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  const isTwoStep = isMobile && !isUpgradeMode
  const requestIdRef = useRef(0)

  const resetVariants = useCallback(() => {
    setVariants([])
    setSelectedVariantIds(new Set())
    setQuantities({})
    setIsLoading(false)
    setErrorMessage(null)
    setStep(1)
  }, [])

  const loadProductData = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setVariants([])
    setErrorMessage(null)
    setIsLoading(true)
    try {
      const data = await fetchCatalog<ProductVariant[]>(
        `/api/catalog/variants?documentId=${encodeURIComponent(product.documentId)}`,
      )
      if (requestIdRef.current !== requestId) {
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
          formattedData.map((variant) => [
            variant.documentId,
            initialQuantity ?? 1,
          ]),
        ),
      )
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return
      }
      const code = (error as { code?: string })?.code
      const message = code
        ? catalogErrorToSpanish(code)
        : "No pudimos cargar las medidas. Inténtalo de nuevo."
      setErrorMessage(message)
      console.error("Error fetching product variants:", message)
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [product.documentId, initialQuantity])

  useEffect(() => {
    if (state.isOpen) {
      loadProductData()
    } else {
      resetVariants()
    }
  }, [state.isOpen, loadProductData, resetVariants])

  const handleClose = () => {
    resetVariants()
    state.close()
  }

  const handleAdd = () => {
    if (isUpgradeMode) {
      const selected = variants.find((variant) =>
        selectedVariantIds.has(variant.documentId),
      )
      if (!selected) {
        return
      }
      onConfirmVariant(selected, quantities[selected.documentId] ?? 1)
      handleClose()
      return
    }

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
        ? `${result.added} medida${result.added === 1 ? "" : "s"} agregada${
            result.added === 1 ? "" : "s"
          }`
        : "Cantidad actualizada"
    toast.success(message)
    handleClose()
  }

  const toggleStep1Selection = (documentId: string) => {
    setSelectedVariantIds((current) => {
      const next = new Set(current)
      if (next.has(documentId)) {
        next.delete(documentId)
      } else {
        next.add(documentId)
      }
      return next
    })
  }

  const handleStep2QuantityChange = (documentId: string, quantity: number) => {
    if (quantity === 0) {
      const next = new Set(selectedVariantIds)
      next.delete(documentId)
      setSelectedVariantIds(next)
      setQuantities((current) => ({ ...current, [documentId]: 1 }))
      if (next.size === 0) {
        setStep(1)
      }
      return
    }
    setQuantities((current) => ({ ...current, [documentId]: quantity }))
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

  const isEmptyState = !isLoading && !errorMessage && variants.length === 0
  const showRail = isTwoStep && !isEmptyState
  const isRailInert = isLoading || errorMessage !== null
  const railSegmentClass = (segment: 1 | 2) =>
    !isRailInert && step >= segment
      ? "bg-primary-200"
      : "bg-gray-200 dark:bg-gray-800"
  const railLabelClass = (segment: 1 | 2) =>
    !isRailInert && step === segment
      ? "text-primary-900 dark:text-primary-100"
      : "text-gray-400"

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
                  Seleccionar medidas
                </p>
                <Drawer.Heading className="mt-2 text-2xl font-bold">
                  {product.name}
                </Drawer.Heading>
                {showRail && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2" aria-hidden="true">
                      <span
                        className={`h-1 flex-1 rounded-full ${railSegmentClass(1)}`}
                      />
                      <span
                        className={`h-1 flex-1 rounded-full ${railSegmentClass(2)}`}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs">
                      <span className={railLabelClass(1)}>1 · Medidas</span>
                      <span className={railLabelClass(2)}>2 · Cantidades</span>
                    </div>
                    <span className="sr-only" aria-live="polite">
                      {step === 1
                        ? "Paso 1 de 2: medidas"
                        : "Paso 2 de 2: cantidades"}
                    </span>
                  </div>
                )}
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 p-6">
              {isLoading &&
                (isTwoStep ? (
                  <div role="status">
                    <span className="sr-only">Cargando medidas...</span>
                    <div
                      className="grid grid-cols-1 gap-2.5 px-4 min-[360px]:px-5 min-[390px]:grid-cols-2 min-[390px]:px-[22px]"
                      aria-hidden="true"
                    >
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="min-h-[74px] overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900"
                        >
                          <Skeleton className="size-full rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p role="status">Cargando medidas...</p>
                ))}
              {errorMessage &&
                (isTwoStep ? (
                  <div
                    role="alert"
                    className="px-4 min-[360px]:px-5 min-[390px]:px-[22px]"
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-gray-100 text-danger dark:bg-gray-800">
                      <RiErrorWarningLine aria-hidden="true" size={20} />
                    </div>
                    <p className="font-medium">{errorMessage}</p>
                    <p className="mt-1 text-sm text-muted">
                      Revisa tu conexión e inténtalo de nuevo.
                    </p>
                    <Button
                      variant="secondary"
                      className={`mt-4 ${NEUTRAL_SECONDARY_BUTTON_CLASS}`}
                      onPress={loadProductData}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <p role="alert">{errorMessage}</p>
                ))}
              {!isLoading && !errorMessage && variants.length === 0 && (
                <p>No encontramos medidas para este producto.</p>
              )}
              {!isLoading &&
                !errorMessage &&
                variants.length > 0 &&
                (isTwoStep ? (
                  step === 1 ? (
                    <div className="px-4 min-[360px]:px-5 min-[390px]:px-[22px]">
                      <p className="mb-4 text-sm text-muted">
                        <span className="min-[360px]:hidden">
                          Toca todas las medidas que necesites.
                        </span>
                        <span className="hidden min-[360px]:inline">
                          Selecciona una o más medidas e indica cuántas piezas
                          necesitas de cada una.
                        </span>
                      </p>
                      <div className="grid grid-cols-1 gap-2.5 min-[390px]:grid-cols-2">
                        {variants.map((variant) => {
                          const isSelected = selectedVariantIds.has(
                            variant.documentId,
                          )
                          return (
                            <button
                              key={variant.documentId}
                              type="button"
                              aria-pressed={isSelected}
                              aria-label={`Seleccionar ${variant.diameter}`}
                              onClick={() =>
                                toggleStep1Selection(variant.documentId)
                              }
                              className={`min-h-[74px] rounded-lg border p-3 text-left ${
                                isSelected
                                  ? "border-primary-400 bg-primary-50 dark:border-primary-200 dark:bg-primary-950"
                                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                              }`}
                            >
                              {isSelected && (
                                <span className="mb-1 inline-flex size-5 items-center justify-center rounded-full bg-primary-200 text-primary-900">
                                  <RiCheckLine size={14} aria-hidden="true" />
                                </span>
                              )}
                              <p
                                className={`text-[14px] min-[390px]:text-[15px] font-medium text-gray-900 ${
                                  isSelected
                                    ? "dark:text-white"
                                    : "dark:text-gray-100"
                                }`}
                              >
                                {variant.diameter}
                              </p>
                              <p
                                className={`text-[12px] min-[360px]:text-[13px] text-gray-600 ${
                                  isSelected
                                    ? "dark:text-primary-100"
                                    : "dark:text-gray-300"
                                }`}
                              >
                                {variant.priceFormatted}
                              </p>
                              <p className="text-[9px] min-[360px]:text-[10px] text-gray-400">
                                {variant.internalId}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 min-[360px]:px-5 min-[390px]:px-[22px]">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-700 dark:text-primary-100"
                      >
                        ← Cambiar medidas
                      </button>
                      <div className="flex flex-col gap-3">
                        {variants
                          .filter((variant) =>
                            selectedVariantIds.has(variant.documentId),
                          )
                          .map((variant) => (
                            <div
                              key={variant.documentId}
                              className="flex flex-col gap-2 rounded-lg border border-default-200 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">
                                  {variant.diameter}
                                </span>
                                <span className="text-muted">
                                  {variant.priceFormatted}
                                </span>
                              </div>
                              <QuantityStepper
                                label={`Cantidad de ${variant.diameter}`}
                                value={quantities[variant.documentId] ?? 1}
                                minValue={0}
                                onChange={(quantity) =>
                                  handleStep2QuantityChange(
                                    variant.documentId,
                                    quantity,
                                  )
                                }
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div>
                    <p className="mb-4 text-sm text-muted">
                      Selecciona una o más medidas e indica cuántas piezas
                      necesitas de cada una.
                    </p>
                    <div className="mb-2 hidden gap-3 px-12 text-xs text-muted uppercase lg:grid lg:grid-cols-[auto_1fr_auto_auto]">
                      <span />
                      <span>Diámetro</span>
                      <span>Cantidad</span>
                      <span>Precio</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {variants.map((variant) => (
                        <div
                          key={variant.documentId}
                          className={`flex flex-col gap-2 rounded-lg border p-3 lg:grid lg:grid-cols-[auto_1fr_auto_auto] lg:items-center lg:gap-3 ${
                            selectedVariantIds.has(variant.documentId)
                              ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
                              : "border-default-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 lg:contents">
                            <Checkbox
                              aria-label={`Seleccionar ${variant.diameter}`}
                              isSelected={selectedVariantIds.has(
                                variant.documentId,
                              )}
                              onChange={(isSelected) => {
                                if (isUpgradeMode) {
                                  setSelectedVariantIds(
                                    isSelected
                                      ? new Set([variant.documentId])
                                      : new Set(),
                                  )
                                  return
                                }
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
                          </div>
                          <div className="flex flex-col items-start gap-2 lg:contents">
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
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </Drawer.Body>
            <Drawer.Footer className="flex-col gap-4 border-t border-default-200 p-6">
              {isTwoStep && isEmptyState ? (
                <Button
                  fullWidth
                  variant="secondary"
                  onPress={handleClose}
                  className={NEUTRAL_SECONDARY_BUTTON_CLASS}
                >
                  Cerrar
                </Button>
              ) : isTwoStep ? (
                <>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm text-muted">
                      {step === 1
                        ? selectedVariantIds.size === 0
                          ? "Ninguna medida seleccionada"
                          : selectedVariantIds.size === 1
                            ? "1 medida elegida"
                            : `${selectedVariantIds.size} medidas elegidas`
                        : selectedVariantIds.size === 1
                          ? `1 medida · ${selectedPieces} pieza${selectedPieces === 1 ? "" : "s"}`
                          : `${selectedVariantIds.size} medidas · ${selectedPieces} piezas`}
                    </span>
                    {step === 2 && (
                      <span className="text-xl font-bold">
                        {formatNumberToCurrency(selectedTotal)}
                      </span>
                    )}
                  </div>
                  <Button
                    fullWidth
                    variant="primary"
                    onPress={step === 1 ? () => setStep(2) : handleAdd}
                    isDisabled={selectedVariantIds.size === 0}
                    className={
                      step === 1 && selectedVariantIds.size === 0
                        ? `${WRAPPING_CTA_CLASS} bg-gray-100! text-gray-400! dark:bg-gray-800! dark:text-gray-500!`
                        : WRAPPING_CTA_CLASS
                    }
                  >
                    {step === 1
                      ? "Continuar a cantidades"
                      : `Agregar ${selectedVariantIds.size} medida${selectedVariantIds.size === 1 ? "" : "s"} al carrito`}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm text-muted">
                      {selectedVariantIds.size} medida
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
                    className={WRAPPING_CTA_CLASS}
                  >
                    {isUpgradeMode
                      ? "Elegir esta medida"
                      : selectedVariantIds.size === 0
                        ? "Agregar al carrito"
                        : `Agregar ${selectedVariantIds.size} medida${selectedVariantIds.size === 1 ? "" : "s"} al carrito`}
                  </Button>
                </>
              )}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
