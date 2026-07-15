"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Drawer, type UseOverlayStateReturn } from "@heroui/react"
import {
  RiAddLine,
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiFileList3Line,
  RiFullscreenLine,
  RiMapPin2Line,
  RiShieldCheckLine,
  RiShoppingCart2Line,
  RiStarFill,
  RiSubtractLine,
  RiTruckLine,
} from "@remixicon/react"
import clsx from "clsx"

import {
  type Product,
  type ProductVariant,
  type ProductVariantUI,
} from "@/shared/types/global.types"
import { getDemoProductVariants } from "@/shared/data/demo-catalog.data"
import {
  catalogErrorToSpanish,
  fetchCatalog,
} from "@/shared/utils/catalog-api.utils"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import {
  getDiscountedUnitPrice,
  roundCurrency,
  VOLUME_TIERS,
} from "@/shared/utils/pricing.utils"
import { useCartStore } from "@/zustand/provider/cart.provider"
import type { FulfillmentMethod } from "@/zustand/store/cart.store"
import { ProductModel3D } from "./ProductModel3D"

interface ProductVariantsDrawerProps {
  product: Product
  state: UseOverlayStateReturn
}

const LENGTH_OPTIONS = [
  { id: "STD", label: "Estándar", multiplier: 1 },
  { id: "LNG", label: "Largo", multiplier: 1.12 },
  { id: "XL", label: "Extra largo", multiplier: 1.22 },
] as const

const GRADE_OPTIONS = [
  { id: "AAV", label: "A.A.V.", multiplier: 1 },
  { id: "HSS", label: "HSS", multiplier: 1.18 },
  { id: "HSSE", label: "HSS-E", multiplier: 1.31 },
] as const

const FULFILLMENT_OPTIONS: Array<{
  id: FulfillmentMethod
  label: string
  detail: string
  eta: string
}> = [
  {
    id: "shipping",
    label: "Paquetería nacional",
    detail: "Envío asegurado a todo México",
    eta: "Llega mar. 21 jul.",
  },
  {
    id: "pickup",
    label: "Recoger en sucursal",
    detail: "Vallejo, Ciudad de México",
    eta: "Listo hoy en 2 h",
  },
  {
    id: "same-day",
    label: "Entrega local hoy",
    detail: "Disponible en zonas seleccionadas",
    eta: "Antes de las 18:00",
  },
]

const RECOMMENDATIONS = [
  {
    id: "volkel-cutting-oil",
    brand: "VÖLKEL",
    name: "Aceite de corte de alto rendimiento",
    price: 289,
    tag: "Mejora el acabado",
  },
  {
    id: "weston-tap-wrench",
    brand: "Weston",
    name: "Maneral ajustable para machuelo",
    price: 438,
    tag: "Compatible",
  },
  {
    id: "truper-caliper",
    brand: "Truper",
    name: "Calibrador digital 6 pulgadas",
    price: 649,
    tag: "Más vendido",
  },
  {
    id: "firestone-belt",
    brand: "Firestone",
    name: "Banda industrial de transmisión A-42",
    price: 372,
    tag: "Entrega inmediata",
  },
] as const

const stableNumber = (value: string) =>
  Array.from(value).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )

const skuSegment = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8)

export const ProductVariantsDrawer = ({
  product,
  state,
}: ProductVariantsDrawerProps) => {
  const [variants, setVariants] = useState<ProductVariantUI[]>([])
  const [selectedVariantIndexes, setSelectedVariantIndexes] = useState<
    Set<number>
  >(new Set())
  const [quantities, setQuantities] = useState<Record<number, number | "">>({})
  const [activeVariantIndex, setActiveVariantIndex] = useState<number | null>(
    null,
  )
  const [selectedLength, setSelectedLength] = useState("STD")
  const [selectedGrade, setSelectedGrade] = useState("AAV")
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("shipping")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const reviewsRef = useRef<HTMLElement>(null)
  const addItem = useCartStore((store) => store.addItem)

  const resetVariants = () => {
    setVariants([])
    setSelectedVariantIndexes(new Set())
    setQuantities({})
    setActiveVariantIndex(null)
    setSelectedLength("STD")
    setSelectedGrade("AAV")
    setFulfillment("shipping")
    setIsExpanded(false)
    setIsAdded(false)
    setIsLoading(false)
    setErrorMessage(null)
  }

  useEffect(() => {
    let isActive = true

    const loadProductData = async () => {
      setVariants([])
      setSelectedVariantIndexes(new Set())
      setActiveVariantIndex(null)
      setErrorMessage(null)
      setIsLoading(true)
      try {
        const data =
          getDemoProductVariants(product.documentId) ??
          (await fetchCatalog<ProductVariant[]>(
            `/api/catalog/variants?documentId=${encodeURIComponent(product.documentId)}`,
          ))
        if (!isActive) {
          return
        }
        const formattedData = data
          .map((variant) => ({
            internalId: variant.internalId,
            diameter: variant.diameter,
            price: variant.pricing.price,
            priceFormatted: formatNumberToCurrency(variant.pricing.price),
          }))
          .sort((a, b) => a.price - b.price)
        setVariants(formattedData)
        setQuantities(
          Object.fromEntries(formattedData.map((_, index) => [index, 1])),
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

  const selectedLengthOption =
    LENGTH_OPTIONS.find((option) => option.id === selectedLength) ??
    LENGTH_OPTIONS[0]
  const selectedGradeOption =
    GRADE_OPTIONS.find((option) => option.id === selectedGrade) ??
    GRADE_OPTIONS[0]
  const dimensionMultiplier =
    selectedLengthOption.multiplier * selectedGradeOption.multiplier
  const activeVariant =
    activeVariantIndex === null ? null : variants[activeVariantIndex]
  const activeUnitPrice = activeVariant
    ? roundCurrency(activeVariant.price * dimensionMultiplier)
    : null
  const startingPrice = product.minPrice ?? variants[0]?.price ?? 0
  const brandName = product.brand?.name ?? "Marca libre"
  const rating = 4.7 + (stableNumber(product.documentId) % 2) / 10
  const reviewCount = 86 + (stableNumber(product.name) % 87)
  const workshopCount = 38 + (stableNumber(product.documentId) % 27)

  const buildSku = (variant: ProductVariantUI) => {
    const baseSku =
      variant.internalId ||
      [
        skuSegment(brandName) || "TEH",
        skuSegment(product.documentId) || "PROD",
        skuSegment(variant.diameter) || "STD",
      ].join("-")

    return `${baseSku}-${selectedLengthOption.id}-${selectedGradeOption.id}`
  }

  const activeSku = activeVariant ? buildSku(activeVariant) : null
  const activeStock = activeSku ? 7 + (stableNumber(activeSku) % 17) : null

  const selectedTotal = variants.reduce((total, variant, index) => {
    if (!selectedVariantIndexes.has(index)) {
      return total
    }

    const quantity = quantities[index] || 1
    const listPrice = roundCurrency(variant.price * dimensionMultiplier)
    const unitPrice = getDiscountedUnitPrice(listPrice, quantity)
    return total + unitPrice * quantity
  }, 0)
  const selectedPieces = variants.reduce(
    (total, _, index) =>
      selectedVariantIndexes.has(index)
        ? total + (quantities[index] || 1)
        : total,
    0,
  )

  const handleClose = () => {
    resetVariants()
    state.close()
  }

  const handleVariantSelection = (index: number, isSelected: boolean) => {
    setSelectedVariantIndexes((current) => {
      const next = new Set(current)
      if (isSelected) {
        next.add(index)
      } else {
        next.delete(index)
      }
      return next
    })
    setIsAdded(false)

    if (isSelected) {
      setActiveVariantIndex(index)
      return
    }

    if (activeVariantIndex === index) {
      const remainingIndex = Array.from(selectedVariantIndexes).find(
        (selectedIndex) => selectedIndex !== index,
      )
      setActiveVariantIndex(remainingIndex ?? null)
    }
  }

  const updateQuantity = (index: number, value: number | "") => {
    setQuantities((current) => ({ ...current, [index]: value }))
    setIsAdded(false)
  }

  const handleAddToCart = () => {
    selectedVariantIndexes.forEach((index) => {
      const variant = variants[index]
      const quantity = quantities[index] || 1
      const listPrice = roundCurrency(variant.price * dimensionMultiplier)
      const unitPrice = getDiscountedUnitPrice(listPrice, quantity)
      const sku = buildSku(variant)

      addItem({
        id: `${product.documentId}:${sku}:${fulfillment}`,
        productId: product.documentId,
        name: product.name,
        brand: brandName,
        sku,
        variant: `${variant.diameter} · ${selectedLengthOption.label} · ${selectedGradeOption.label}`,
        fulfillment,
        listPrice,
        unitPrice,
        quantity,
      })
    })
    setIsAdded(true)
  }

  const handleAddRecommendation = (
    recommendation: (typeof RECOMMENDATIONS)[number],
  ) => {
    addItem({
      id: `${recommendation.id}:standard:${fulfillment}`,
      productId: recommendation.id,
      name: recommendation.name,
      brand: recommendation.brand,
      sku: recommendation.id.toUpperCase(),
      variant: "Presentación estándar",
      fulfillment,
      listPrice: recommendation.price,
      unitPrice: recommendation.price,
      quantity: 1,
    })
    setIsAdded(true)
  }

  const openReviews = () => {
    setIsExpanded(true)
    window.setTimeout(
      () => reviewsRef.current?.scrollIntoView({ behavior: "smooth" }),
      180,
    )
  }

  return (
    <Drawer state={state}>
      <Drawer.Backdrop className="bg-emerald-950/35 backdrop-blur-[2px]">
        <Drawer.Content placement="right">
          <Drawer.Dialog
            className={clsx(
              "flex h-full !w-full flex-col !p-0 text-[#14251d] transition-[translate,max-width] duration-300 motion-reduce:transition-none dark:text-zinc-50",
              isExpanded ? "!max-w-none" : "!max-w-[920px]",
              "bg-[#f7f8f4] dark:bg-zinc-950",
            )}
          >
            <Drawer.Header className="border-b border-black/8 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950 sm:px-6">
              <div className="flex w-full items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.18em] text-primary-700 uppercase dark:text-primary-200">
                    {isExpanded ? "Ficha completa" : "Compra rápida"}
                  </p>
                  <Drawer.Heading className="mt-0.5 truncate text-sm font-bold sm:text-base">
                    {product.name}
                  </Drawer.Heading>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="tertiary"
                    aria-label={
                      isExpanded
                        ? "Volver a vista rápida"
                        : "Ver ficha completa"
                    }
                    aria-expanded={isExpanded}
                    onPress={() => setIsExpanded((current) => !current)}
                  >
                    <RiFullscreenLine aria-hidden="true" size={17} />
                    <span className="hidden sm:inline">
                      {isExpanded
                        ? "Volver a vista rápida"
                        : "Ver ficha completa"}
                    </span>
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label="Cerrar"
                    onPress={handleClose}
                  >
                    <RiCloseLine aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="!m-0 !mt-0 flex-1 overflow-y-auto !p-0">
              {isLoading && (
                <div
                  className="flex min-h-80 flex-col items-center justify-center gap-4 p-8"
                  role="status"
                >
                  <span className="size-9 animate-spin rounded-full border-2 border-primary-700 border-t-transparent dark:border-primary-200 dark:border-t-transparent" />
                  <p className="font-semibold">Cargando variantes...</p>
                </div>
              )}
              {errorMessage && (
                <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
                  <p className="font-semibold" role="alert">
                    {errorMessage}
                  </p>
                  <p className="mt-2 text-sm opacity-80">
                    Cierra esta ventana e inténtalo nuevamente.
                  </p>
                </div>
              )}
              {!isLoading && !errorMessage && variants.length === 0 && (
                <div className="m-6 rounded-2xl border border-default-200 bg-white p-6 dark:bg-zinc-900">
                  <p className="font-semibold">
                    No encontramos variantes para este producto.
                  </p>
                </div>
              )}

              {!isLoading && !errorMessage && variants.length > 0 && (
                <>
                  <section
                    className={clsx(
                      "mx-auto grid gap-6 p-4 sm:p-6",
                      isExpanded
                        ? "max-w-[1440px] lg:grid-cols-[minmax(340px,0.85fr)_minmax(440px,1.15fr)] lg:gap-10 lg:px-10 lg:py-8"
                        : "max-w-[920px] lg:grid-cols-[minmax(300px,0.9fr)_minmax(380px,1.1fr)]",
                    )}
                  >
                    <div
                      className={clsx(
                        isExpanded && "lg:sticky lg:top-5 lg:self-start",
                      )}
                    >
                      <ProductModel3D
                        key={product.documentId}
                        product={product}
                        sku={activeSku ?? undefined}
                      />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-black/8 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
                          <RiShieldCheckLine
                            className="text-primary-700 dark:text-primary-200"
                            aria-hidden="true"
                            size={18}
                          />
                          <p className="mt-2 text-xs font-bold">Garantía</p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            12 meses
                          </p>
                        </div>
                        <div className="rounded-xl border border-black/8 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
                          <RiFileList3Line
                            className="text-primary-700 dark:text-primary-200"
                            aria-hidden="true"
                            size={18}
                          />
                          <p className="mt-2 text-xs font-bold">Factura</p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            CFDI 4.0
                          </p>
                        </div>
                        <div className="rounded-xl border border-black/8 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
                          <RiCheckboxCircleFill
                            className="text-primary-700 dark:text-primary-200"
                            aria-hidden="true"
                            size={18}
                          />
                          <p className="mt-2 text-xs font-bold">
                            Compra segura
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            30 días
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-emerald-950 px-2.5 py-1 font-black tracking-wide text-white uppercase dark:bg-primary-200 dark:text-primary-950">
                          {brandName}
                        </span>
                        {product.category?.name && (
                          <span className="text-muted">
                            {product.category.name}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-2xl leading-tight font-black tracking-tight sm:text-3xl">
                        {product.name}
                      </h2>
                      <button
                        type="button"
                        className="mt-3 flex items-center gap-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
                        onClick={openReviews}
                      >
                        <span
                          className="flex text-amber-500"
                          aria-hidden="true"
                        >
                          {Array.from({ length: 5 }, (_, index) => (
                            <RiStarFill key={index} size={15} />
                          ))}
                        </span>
                        <strong>{rating.toFixed(1)}</strong>
                        <span className="text-muted underline decoration-dotted underline-offset-4">
                          {reviewCount} reseñas verificadas
                        </span>
                      </button>
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-900 dark:bg-primary-950 dark:text-primary-100">
                        <span className="flex -space-x-1.5" aria-hidden="true">
                          {["RC", "JM", "AL"].map((initials) => (
                            <span
                              className="flex size-6 items-center justify-center rounded-full border-2 border-primary-50 bg-primary-800 text-[8px] text-white dark:border-primary-950"
                              key={initials}
                            >
                              {initials}
                            </span>
                          ))}
                        </span>
                        Comprado por {workshopCount} talleres este mes
                      </div>

                      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-y border-black/8 py-4 dark:border-white/10">
                        <div aria-live="polite">
                          <p className="text-xs font-bold tracking-wide text-muted uppercase">
                            {activeUnitPrice === null
                              ? "Precio desde"
                              : "Precio unitario"}
                          </p>
                          <p className="mt-1 text-3xl font-black tracking-tight tabular-nums">
                            {activeUnitPrice === null
                              ? `Desde ${formatNumberToCurrency(startingPrice)}`
                              : formatNumberToCurrency(activeUnitPrice)}
                          </p>
                          <p className="text-[11px] text-muted">MXN + IVA</p>
                        </div>
                        <div className="text-right">
                          {activeStock === null ? (
                            <p className="text-xs text-muted">
                              Selecciona una medida para consultar existencias
                            </p>
                          ) : (
                            <>
                              <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                                Quedan {activeStock} en CDMX
                              </p>
                              <p className="mt-1 text-[11px] text-muted">
                                SKU {activeSku}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <fieldset className="mt-5">
                        <legend className="flex w-full items-center justify-between text-sm font-black">
                          <span>1. Diámetro</span>
                          <span className="text-xs font-normal text-muted">
                            Puedes elegir varios
                          </span>
                        </legend>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {variants.map((variant, index) => {
                            const isSelected = selectedVariantIndexes.has(index)

                            return (
                              <label
                                className={clsx(
                                  "relative cursor-pointer rounded-xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-primary-200",
                                  isSelected
                                    ? "border-primary-700 bg-primary-50 shadow-[inset_0_0_0_1px_#125d03] dark:border-primary-200 dark:bg-primary-950"
                                    : "border-black/10 bg-white hover:border-primary-700 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-primary-200",
                                )}
                                key={`${variant.diameter}-${variant.price}`}
                              >
                                <input
                                  className="sr-only"
                                  type="checkbox"
                                  aria-label={`Seleccionar ${variant.diameter}`}
                                  checked={isSelected}
                                  onChange={(event) =>
                                    handleVariantSelection(
                                      index,
                                      event.target.checked,
                                    )
                                  }
                                />
                                <span className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-black">
                                    {variant.diameter}
                                  </span>
                                  <span
                                    className={clsx(
                                      "mt-0.5 size-3.5 rounded-full border",
                                      isSelected
                                        ? "border-primary-700 bg-primary-700 ring-2 ring-primary-100 dark:border-primary-200 dark:bg-primary-200"
                                        : "border-default-300",
                                    )}
                                    aria-hidden="true"
                                  />
                                </span>
                                <span className="mt-1 block text-xs text-muted tabular-nums">
                                  {variant.priceFormatted}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </fieldset>

                      <fieldset className="mt-5">
                        <legend className="text-sm font-black">2. Largo</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {LENGTH_OPTIONS.map((option) => (
                            <button
                              type="button"
                              aria-pressed={selectedLength === option.id}
                              className={clsx(
                                "rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:outline-none",
                                selectedLength === option.id
                                  ? "border-emerald-950 bg-emerald-950 text-white dark:border-primary-200 dark:bg-primary-200 dark:text-primary-950"
                                  : "border-black/10 bg-white hover:border-emerald-950 dark:border-white/10 dark:bg-zinc-900",
                              )}
                              key={option.id}
                              onClick={() => {
                                setSelectedLength(option.id)
                                setIsAdded(false)
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="mt-5">
                        <legend className="text-sm font-black">3. Grado</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {GRADE_OPTIONS.map((option) => (
                            <button
                              type="button"
                              aria-pressed={selectedGrade === option.id}
                              className={clsx(
                                "rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:outline-none",
                                selectedGrade === option.id
                                  ? "border-emerald-950 bg-emerald-950 text-white dark:border-primary-200 dark:bg-primary-200 dark:text-primary-950"
                                  : "border-black/10 bg-white hover:border-emerald-950 dark:border-white/10 dark:bg-zinc-900",
                              )}
                              key={option.id}
                              onClick={() => {
                                setSelectedGrade(option.id)
                                setIsAdded(false)
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      {selectedVariantIndexes.size > 0 && (
                        <div className="mt-5 rounded-2xl border border-black/8 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-black">Cantidades</h3>
                            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-900 dark:bg-primary-950 dark:text-primary-100">
                              Hasta 12% menos por volumen
                            </span>
                          </div>
                          <div className="mt-3 divide-y divide-default-100">
                            {Array.from(selectedVariantIndexes).map((index) => {
                              const variant = variants[index]
                              const quantity = quantities[index]

                              return (
                                <div
                                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                  key={`${variant.diameter}-quantity`}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold">
                                      {variant.diameter}
                                    </p>
                                    <p className="truncate text-[10px] text-muted">
                                      {buildSku(variant)}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center rounded-lg border border-default-200 bg-default-50 dark:bg-zinc-950">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="tertiary"
                                      aria-label={`Restar una unidad de ${variant.diameter}`}
                                      onPress={() =>
                                        updateQuantity(
                                          index,
                                          Math.max(1, (quantity || 1) - 1),
                                        )
                                      }
                                    >
                                      <RiSubtractLine
                                        aria-hidden="true"
                                        size={15}
                                      />
                                    </Button>
                                    <input
                                      aria-label={`Cantidad de ${variant.diameter}`}
                                      className="h-8 w-12 bg-transparent text-center text-sm font-black tabular-nums outline-none"
                                      min={1}
                                      type="number"
                                      value={quantity ?? 1}
                                      onChange={(event) => {
                                        const value = event.target.value
                                        const parsedQuantity = Number(value)
                                        updateQuantity(
                                          index,
                                          value === ""
                                            ? ""
                                            : Number.isInteger(
                                                  parsedQuantity,
                                                ) && parsedQuantity > 0
                                              ? parsedQuantity
                                              : 1,
                                        )
                                      }}
                                    />
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="tertiary"
                                      aria-label={`Agregar una unidad de ${variant.diameter}`}
                                      onPress={() =>
                                        updateQuantity(
                                          index,
                                          (quantity || 1) + 1,
                                        )
                                      }
                                    >
                                      <RiAddLine aria-hidden="true" size={15} />
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <fieldset className="mt-6">
                        <legend className="text-sm font-black">
                          4. ¿Cómo quieres recibirlo?
                        </legend>
                        <div
                          className="mt-3 grid gap-2"
                          role="radiogroup"
                          aria-label="Método de entrega"
                        >
                          {FULFILLMENT_OPTIONS.map((option, index) => (
                            <button
                              type="button"
                              role="radio"
                              aria-checked={fulfillment === option.id}
                              className={clsx(
                                "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:outline-none",
                                fulfillment === option.id
                                  ? "border-primary-700 bg-primary-50 dark:border-primary-200 dark:bg-primary-950"
                                  : "border-black/10 bg-white hover:border-primary-700 dark:border-white/10 dark:bg-zinc-900",
                              )}
                              key={option.id}
                              onClick={() => {
                                setFulfillment(option.id)
                                setIsAdded(false)
                              }}
                            >
                              <span className="flex size-9 items-center justify-center rounded-full bg-emerald-950 text-white dark:bg-primary-200 dark:text-primary-950">
                                {index === 0 ? (
                                  <RiTruckLine aria-hidden="true" size={17} />
                                ) : (
                                  <RiMapPin2Line aria-hidden="true" size={17} />
                                )}
                              </span>
                              <span>
                                <span className="block text-sm font-black">
                                  {option.label}
                                </span>
                                <span className="block text-[11px] text-muted">
                                  {option.detail}
                                </span>
                              </span>
                              <span className="max-w-24 text-right text-[11px] font-bold text-primary-800 dark:text-primary-200">
                                {option.eta}
                              </span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </section>

                  {isExpanded && (
                    <div className="border-t border-black/8 bg-white dark:border-white/10 dark:bg-zinc-950">
                      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-14">
                        <div>
                          <p className="text-[11px] font-black tracking-[0.18em] text-primary-700 uppercase dark:text-primary-200">
                            Precio para profesionales
                          </p>
                          <h2 className="mt-2 text-2xl font-black tracking-tight">
                            Entre más produces, menos pagas.
                          </h2>
                          <p className="mt-3 max-w-lg text-sm text-muted">
                            El descuento se aplica automáticamente por cada
                            medida. Combina variantes en el mismo pedido y
                            conserva la factura desglosada por SKU.
                          </p>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-black/8 dark:border-white/10">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-emerald-950 text-white dark:bg-primary-950">
                              <tr>
                                <th className="px-4 py-3 font-bold">Piezas</th>
                                <th className="px-4 py-3 font-bold">
                                  Precio unitario
                                </th>
                                <th className="px-4 py-3 text-right font-bold">
                                  Ahorro
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-default-100">
                              {VOLUME_TIERS.map((tier) => (
                                <tr key={tier.label}>
                                  <td className="px-4 py-3 font-bold">
                                    {tier.label}
                                  </td>
                                  <td className="px-4 py-3 tabular-nums">
                                    {formatNumberToCurrency(
                                      (activeUnitPrice || startingPrice) *
                                        (1 - tier.discount),
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-primary-700 dark:text-primary-200">
                                    {tier.discount === 0
                                      ? "Precio lista"
                                      : `${tier.discount * 100}%`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section className="border-y border-black/8 bg-[#eff3ec] dark:border-white/10 dark:bg-zinc-900/70">
                        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-14">
                          <div>
                            <p className="text-[11px] font-black tracking-[0.18em] text-primary-700 uppercase dark:text-primary-200">
                              Especificaciones
                            </p>
                            <h2 className="mt-2 text-2xl font-black">
                              Hecho para jornadas exigentes
                            </h2>
                          </div>
                          <dl className="grid gap-px overflow-hidden rounded-2xl border border-black/8 bg-black/8 sm:grid-cols-2 dark:border-white/10 dark:bg-white/10">
                            {[
                              ["Material", selectedGradeOption.label],
                              ["Acabado", "Rectificado de precisión"],
                              ["Tolerancia", "ISO 2 / 6H"],
                              ["Uso recomendado", "Acero, hierro y aluminio"],
                              ["Origen", "Alemania / México"],
                              ["Trazabilidad", activeSku ?? "Según variante"],
                            ].map(([label, value]) => (
                              <div
                                className="bg-white p-4 dark:bg-zinc-950"
                                key={label}
                              >
                                <dt className="text-xs text-muted">{label}</dt>
                                <dd className="mt-1 text-sm font-bold">
                                  {value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </section>

                      <section
                        className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14"
                        ref={reviewsRef}
                      >
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                          <div>
                            <p className="text-[11px] font-black tracking-[0.18em] text-primary-700 uppercase dark:text-primary-200">
                              Opiniones de compradores verificados
                            </p>
                            <h2 className="mt-2 text-2xl font-black">
                              Evaluado en el trabajo, no en una vitrina.
                            </h2>
                          </div>
                          <div className="flex items-end gap-3">
                            <span className="text-5xl font-black">
                              {rating.toFixed(1)}
                            </span>
                            <div className="pb-1">
                              <div className="flex text-amber-500">
                                {Array.from({ length: 5 }, (_, index) => (
                                  <RiStarFill key={index} size={16} />
                                ))}
                              </div>
                              <p className="mt-1 text-xs text-muted">
                                {reviewCount} reseñas
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
                          <div className="rounded-2xl border border-black/8 p-5 dark:border-white/10">
                            {[
                              ["Durabilidad", 96],
                              ["Precisión", 94],
                              ["Valor por precio", 91],
                            ].map(([label, score]) => (
                              <div className="mb-5 last:mb-0" key={label}>
                                <div className="flex justify-between text-sm">
                                  <span className="font-bold">{label}</span>
                                  <span>{score}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-default-100">
                                  <div
                                    className="h-full rounded-full bg-primary-400"
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {[
                              {
                                initials: "RM",
                                name: "Raúl Martínez",
                                role: "Jefe de taller · Compra verificada",
                                review:
                                  "Conservó la medida después de más de 300 ciclos. El empaque trae el SKU claramente marcado y pudimos reordenar sin error.",
                              },
                              {
                                initials: "CG",
                                name: "Carolina García",
                                role: "Compras industriales · Compra verificada",
                                review:
                                  "La precisión fue consistente entre lotes. Recibimos factura y el pedido completo al día siguiente en planta.",
                              },
                            ].map((review) => (
                              <article
                                className="rounded-2xl border border-black/8 bg-[#f7f8f4] p-5 dark:border-white/10 dark:bg-zinc-900"
                                key={review.name}
                              >
                                <div className="flex text-amber-500">
                                  {Array.from({ length: 5 }, (_, index) => (
                                    <RiStarFill key={index} size={14} />
                                  ))}
                                </div>
                                <p className="mt-4 text-sm leading-relaxed">
                                  “{review.review}”
                                </p>
                                <div className="mt-5 flex items-center gap-3">
                                  <span className="flex size-9 items-center justify-center rounded-full bg-emerald-950 text-xs font-bold text-white dark:bg-primary-200 dark:text-primary-950">
                                    {review.initials}
                                  </span>
                                  <div>
                                    <p className="text-sm font-black">
                                      {review.name}
                                    </p>
                                    <p className="text-[10px] text-muted">
                                      {review.role}
                                    </p>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      </section>

                      <section className="border-t border-black/8 bg-[#14251d] text-white dark:border-white/10 dark:bg-black">
                        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                              <p className="text-[11px] font-black tracking-[0.18em] text-primary-200 uppercase">
                                Completa el trabajo
                              </p>
                              <h2 className="mt-2 text-2xl font-black">
                                Lo que otros talleres compran con esta pieza
                              </h2>
                            </div>
                            <span className="text-sm text-white/60">
                              Agrega sin perder tu configuración
                            </span>
                          </div>
                          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {RECOMMENDATIONS.map((recommendation) => (
                              <article
                                className="flex min-h-56 flex-col rounded-2xl border border-white/12 bg-white/6 p-4"
                                key={recommendation.id}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-black tracking-wide text-primary-200 uppercase">
                                    {recommendation.brand}
                                  </span>
                                  <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold">
                                    {recommendation.tag}
                                  </span>
                                </div>
                                <div className="mt-5 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-400 to-zinc-700 shadow-lg">
                                  <span className="size-7 rounded-full border-4 border-zinc-800 bg-zinc-300 shadow-inner" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold">
                                  {recommendation.name}
                                </h3>
                                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                                  <span className="font-black tabular-nums">
                                    {formatNumberToCurrency(
                                      recommendation.price,
                                    )}
                                  </span>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="primary"
                                    aria-label={`Agregar ${recommendation.name}`}
                                    onPress={() =>
                                      handleAddRecommendation(recommendation)
                                    }
                                  >
                                    <RiAddLine aria-hidden="true" />
                                  </Button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </>
              )}
            </Drawer.Body>

            <Drawer.Footer className="!mt-0 border-t border-black/10 bg-white px-4 py-3 shadow-[0_-12px_30px_rgba(20,37,29,0.08)] dark:border-white/10 dark:bg-zinc-950 sm:px-6">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4 sm:block">
                  <span className="block text-xs text-muted">
                    {selectedVariantIndexes.size} variante
                    {selectedVariantIndexes.size === 1 ? "" : "s"} ·{" "}
                    {selectedPieces} pieza{selectedPieces === 1 ? "" : "s"}
                  </span>
                  <span className="block text-xl font-black tabular-nums">
                    {formatNumberToCurrency(selectedTotal)}
                  </span>
                </div>
                <div className="sm:w-[min(360px,48%)]">
                  <Button
                    fullWidth
                    size="lg"
                    variant="primary"
                    className="font-black"
                    onPress={handleAddToCart}
                    isDisabled={selectedVariantIndexes.size === 0}
                  >
                    <RiShoppingCart2Line aria-hidden="true" />
                    {selectedVariantIndexes.size === 0
                      ? "Agregar al carrito"
                      : `Agregar ${selectedVariantIndexes.size} al carrito`}
                    <RiArrowRightLine aria-hidden="true" />
                  </Button>
                  {isAdded && (
                    <p
                      className="mt-1 text-center text-[11px] font-bold text-primary-700 dark:text-primary-200"
                      role="status"
                    >
                      Agregado. Tu configuración quedó guardada en el carrito.
                    </p>
                  )}
                </div>
              </div>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
