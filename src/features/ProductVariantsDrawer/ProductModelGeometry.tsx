import clsx from "clsx"

import type { ProductModelKind } from "@/shared/utils/product-model.utils"

interface ProductModelGeometryProps {
  kind: ProductModelKind
  brand: string
  sku: string
}

const RADIAL_MODELS: ProductModelKind[] = [
  "nut",
  "washer",
  "die",
  "socket",
  "generic",
]

const LINEAR_MODELS: ProductModelKind[] = ["tap", "endmill", "drill", "bolt"]

const LinearTool = ({
  kind,
  brand,
}: {
  kind: ProductModelKind
  brand: string
}) => (
  <div
    className={clsx("product-model-linear", `product-model-linear--${kind}`)}
  >
    <span className="product-model-linear-head" />
    <span className="product-model-linear-shank" />
    <span className="product-model-linear-body">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="product-model-linear-flute" key={index} />
      ))}
    </span>
    <span className="product-model-linear-tip" />
    <span className="product-model-linear-brand">{brand.slice(0, 12)}</span>
  </div>
)

export const ProductModelGeometry = ({
  kind,
  brand,
  sku,
}: ProductModelGeometryProps) => {
  if (LINEAR_MODELS.includes(kind)) {
    return <LinearTool kind={kind} brand={brand} />
  }

  if (kind === "drill-set") {
    return (
      <div className="product-model-drill-set">
        {[0, 1, 2].map((index) => (
          <div className="product-model-set-bit" key={index}>
            <span className="product-model-set-bit-shank" />
            <span className="product-model-set-bit-body" />
            <span className="product-model-set-bit-tip" />
          </div>
        ))}
      </div>
    )
  }

  if (kind === "belt") {
    return (
      <div className="product-model-belt">
        <span className="product-model-belt-ring" />
        <span className="product-model-belt-groove" />
        <span className="product-model-belt-label">{brand.slice(0, 12)}</span>
      </div>
    )
  }

  if (kind === "clamp") {
    return (
      <div className="product-model-clamp">
        <span className="product-model-clamp-body" />
        <span className="product-model-clamp-screw" />
        <span className="product-model-clamp-pad" />
      </div>
    )
  }

  if (RADIAL_MODELS.includes(kind)) {
    const rimCount = kind === "nut" ? 12 : 24
    return (
      <div
        className={clsx(
          "product-model-radial",
          `product-model-radial--${kind}`,
        )}
      >
        <div className="product-model-face product-model-face-front">
          <span className="product-model-engraving">{brand}</span>
          <span className="product-model-engraving product-model-engraving-bottom">
            {sku.slice(0, 15)}
          </span>
          <span className="product-model-hole product-model-hole-main" />
          {kind === "die" && (
            <>
              <span className="product-model-hole product-model-hole-one" />
              <span className="product-model-hole product-model-hole-two" />
              <span className="product-model-hole product-model-hole-three" />
            </>
          )}
        </div>
        <div className="product-model-face product-model-face-back">
          <span className="product-model-hole product-model-hole-main" />
        </div>
        {Array.from({ length: rimCount }, (_, index) => (
          <span
            className="product-model-rim"
            key={index}
            style={{
              transform: `rotateZ(${index * (360 / rimCount)}deg) translateY(-99px) rotateX(90deg)`,
            }}
          />
        ))}
      </div>
    )
  }

  return null
}
