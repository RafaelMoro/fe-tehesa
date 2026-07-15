"use client"

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { Button } from "@heroui/react"
import { RiDragMove2Line, RiPlayLine, RiStopLine } from "@remixicon/react"
import clsx from "clsx"

interface ProductModel3DProps {
  brand?: string
  sku?: string
}

type Rotation = {
  x: number
  y: number
}

export const ProductModel3D = ({
  brand = "TEHESA",
  sku = "INDUSTRIAL",
}: ProductModel3DProps) => {
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
    <div className="product-model-panel">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white uppercase backdrop-blur">
          Vista 3D
        </span>
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
      </div>
      <div
        className="product-model-scene"
        role="img"
        tabIndex={0}
        aria-label="Modelo 3D interactivo de una pieza industrial. Arrastra o usa las flechas para girarlo."
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
            className="product-model-object"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            <div className="product-model-face product-model-face-front">
              <span className="product-model-engraving">{brand}</span>
              <span className="product-model-engraving product-model-engraving-bottom">
                {sku.slice(0, 15)}
              </span>
              <span className="product-model-hole product-model-hole-main" />
              <span className="product-model-hole product-model-hole-one" />
              <span className="product-model-hole product-model-hole-two" />
              <span className="product-model-hole product-model-hole-three" />
            </div>
            <div className="product-model-face product-model-face-back">
              <span className="product-model-hole product-model-hole-main" />
            </div>
            {Array.from({ length: 24 }, (_, index) => (
              <span
                className="product-model-rim"
                key={index}
                style={{
                  transform: `rotateZ(${index * 15}deg) translateY(-99px) rotateX(90deg)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 pb-4 text-xs text-white/70">
        <RiDragMove2Line aria-hidden="true" size={15} />
        <span>Arrastra para inspeccionar la pieza</span>
      </div>
    </div>
  )
}
