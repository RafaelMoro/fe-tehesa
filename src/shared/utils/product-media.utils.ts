import type { Product } from "@/shared/types/global.types"

export type ProductMediaAsset = {
  src: string
  alt: string
}

const normalizeProductName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")

export const getProductMediaAsset = (
  product: Pick<Product, "name">,
): ProductMediaAsset | null => {
  const name = normalizeProductName(product.name)

  if (
    name.includes("cortador vertical") &&
    name.includes("carburo") &&
    (name.includes("4 filos") || name.includes("4f"))
  ) {
    return {
      src: "/products/cortador-carburo-4-filos.png",
      alt: "Cortador vertical de carburo plano con cuatro filos",
    }
  }

  if (
    name.includes("machuel") &&
    (name.includes("agujero ciego") || name.includes("agujeros ciegos")) &&
    (name.includes("hss-e") || name.includes("maquina"))
  ) {
    return {
      src: "/products/machuelo-hsse-agujero-ciego.png",
      alt: "Tres machuelos de máquina para agujero ciego",
    }
  }

  return null
}
