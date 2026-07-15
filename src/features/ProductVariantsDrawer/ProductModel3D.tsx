"use client"

import Image from "next/image"
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { Button } from "@heroui/react"
import {
  RiBox3Line,
  RiDragMove2Line,
  RiImageLine,
  RiPlayLine,
  RiStopLine,
} from "@remixicon/react"
import clsx from "clsx"

import type { Product } from "@/shared/types/global.types"
import { getProductMediaAsset } from "@/shared/utils/product-media.utils"
import {
  getProductModelKind,
  getProductModelLabel,
} from "@/shared/utils/product-model.utils"
import { ProductModelGeometry } from "./ProductModelGeometry"

interface ProductModel3DProps {
  product: Pick<Product, "name" | "category" | "brand">
  sku?: string
}

type Rotation = {
  x: number
  y: number
}

type ProductViewMode = "photo" | "model"

export const ProductModel3D = ({
  product,
  sku = "INDUSTRIAL",
}: ProductModel3DProps) => {
  const kind = getProductModelKind(product)
  const modelLabel = getProductModelLabel(kind)
  const brand = product.brand?.name ?? "TEHESA"
  const media = getProductMediaAsset(product)
  const [viewMode, setViewMode] = useState<ProductViewMode>(
    media ? "photo" : "model",
  )
  const [rotation, setRotation] = useState<Rotation>({ x: -14, y: 24 })
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const dragRef = useRef<
    | {
        pointerId: number
        startX: number
        startY: number
        rotation: Rotation
      }
    | undefined
  >(undefined)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setIsAutoRotating(false)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rotation,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    setRotation({
      x: Math.max(
        -65,
        Math.min(65, drag.rotation.x - (event.clientY - drag.startY) * 0.35),
      ),
      y: drag.rotation.y + (event.clientX - drag.startX) * 0.45,
    })
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = undefined
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const offsets: Partial<Record<string, Rotation>> = {
      ArrowLeft: { x: 0, y: -12 },
      ArrowRight: { x: 0, y: 12 },
      ArrowUp: { x: -8, y: 0 },
      ArrowDown: { x: 8, y: 0 },
    }
    const offset = offsets[event.key]

    if (!offset) {
      return
    }

    event.preventDefault()
    setIsAutoRotating(false)
    setRotation((current) => ({
      x: Math.max(-65, Math.min(65, current.x + offset.x)),
      y: current.y + offset.y,
    }))
  }

  return (
    <div
      className={clsx("product-model-panel", `product-model-panel--${kind}`)}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white uppercase backdrop-blur">
          {viewMode === "photo"
            ? "Foto del producto"
            : `Vista 3D · ${modelLabel}`}
        </span>
        <div className="flex items-center gap-1">
          {media && (
            <div className="flex rounded-lg border border-white/15 bg-black/20 p-0.5">
              <Button
                size="sm"
                variant={viewMode === "photo" ? "primary" : "tertiary"}
                className={viewMode === "photo" ? "" : "text-white"}
                aria-pressed={viewMode === "photo"}
                onPress={() => setViewMode("photo")}
              >
                <RiImageLine aria-hidden="true" size={15} />
                Foto
              </Button>
              <Button
                size="sm"
                variant={viewMode === "model" ? "primary" : "tertiary"}
                className={viewMode === "model" ? "" : "text-white"}
                aria-pressed={viewMode === "model"}
                onPress={() => setViewMode("model")}
              >
                <RiBox3Line aria-hidden="true" size={15} />
                3D
              </Button>
            </div>
          )}
          {viewMode === "model" && (
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              className="text-white"
              aria-label={
                isAutoRotating ? "Pausar rotación 3D" : "Reproducir rotación 3D"
              }
              onPress={() => setIsAutoRotating((current) => !current)}
            >
              {isAutoRotating ? (
                <RiStopLine aria-hidden="true" size={17} />
              ) : (
                <RiPlayLine aria-hidden="true" size={17} />
              )}
            </Button>
          )}
        </div>
      </div>
      {viewMode === "photo" && media ? (
        <div className="product-model-photo-stage">
          <span className="product-model-photo-depth" aria-hidden="true" />
          <Image
            fill
            priority
            alt={media.alt}
            className="product-model-photo-image"
            sizes="(max-width: 920px) 80vw, 420px"
            src={media.src}
          />
        </div>
      ) : (
        <div
          className="product-model-scene"
          role="img"
          tabIndex={0}
          aria-label={`Modelo 3D interactivo de ${modelLabel.toLocaleLowerCase("es-MX")}. Arrastra o usa las flechas para girarlo.`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <div
            className={clsx(
              "product-model-auto",
              isAutoRotating && "is-spinning",
            )}
          >
            <div
              className={clsx(
                "product-model-object",
                `product-model-object--${kind}`,
              )}
              style={{
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              }}
            >
              <ProductModelGeometry kind={kind} brand={brand} sku={sku} />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-2 pb-4 text-xs text-white/70">
        {viewMode === "photo" ? (
          <>
            <RiImageLine aria-hidden="true" size={15} />
            <span>
              Fotografía de referencia · Cambia a 3D para inspeccionarla
            </span>
          </>
        ) : (
          <>
            <RiDragMove2Line aria-hidden="true" size={15} />
            <span>Arrastra para inspeccionar la pieza</span>
          </>
        )}
      </div>
    </div>
  )
}
