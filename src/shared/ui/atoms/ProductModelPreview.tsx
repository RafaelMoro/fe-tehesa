import Image from "next/image"
import clsx from "clsx"

import type { Product } from "@/shared/types/global.types"
import { getProductMediaAsset } from "@/shared/utils/product-media.utils"
import { getProductModelKind } from "@/shared/utils/product-model.utils"

interface ProductModelPreviewProps {
  product: Pick<Product, "name" | "category">
}

export const ProductModelPreview = ({ product }: ProductModelPreviewProps) => {
  const kind = getProductModelKind(product)
  const media = getProductMediaAsset(product)
  const isLinearModel =
    kind === "tap" || kind === "endmill" || kind === "drill" || kind === "bolt"
  const isRadialModel =
    kind === "nut" ||
    kind === "washer" ||
    kind === "die" ||
    kind === "socket" ||
    kind === "generic"

  if (media) {
    return (
      <div
        className={clsx(
          "product-preview product-preview--photo",
          `product-preview--${kind}`,
        )}
      >
        <span className="product-preview-shadow" aria-hidden="true" />
        <div className="product-photo-card">
          <span className="product-photo-card-depth" aria-hidden="true" />
          <Image
            fill
            alt={media.alt}
            className="product-photo-card-image"
            sizes="160px"
            src={media.src}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx("product-preview", `product-preview--${kind}`)}
      aria-hidden="true"
    >
      <span className="product-preview-shadow" />

      {kind === "belt" && (
        <span className="product-preview-belt">
          <span />
        </span>
      )}

      {kind === "clamp" && (
        <span className="product-preview-clamp">
          <span className="product-preview-clamp-screw" />
        </span>
      )}

      {kind === "drill-set" && (
        <span className="product-preview-set">
          {[0, 1, 2].map((index) => (
            <span className="product-preview-set-bit" key={index} />
          ))}
        </span>
      )}

      {isLinearModel && (
        <span className="product-preview-linear">
          <span className="product-preview-linear-head" />
          <span className="product-preview-linear-body" />
          <span className="product-preview-linear-tip" />
        </span>
      )}

      {isRadialModel && (
        <span className="product-preview-radial">
          <span className="product-preview-radial-hole" />
          <span className="product-preview-radial-mark" />
        </span>
      )}
    </div>
  )
}
