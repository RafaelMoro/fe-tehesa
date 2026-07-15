import type { Product } from "@/shared/types/global.types"

export type ProductModelKind =
  | "tap"
  | "endmill"
  | "drill"
  | "drill-set"
  | "belt"
  | "bolt"
  | "nut"
  | "washer"
  | "die"
  | "socket"
  | "clamp"
  | "generic"

const MODEL_LABELS: Record<ProductModelKind, string> = {
  tap: "Machuelo",
  endmill: "Cortador",
  drill: "Broca",
  "drill-set": "Juego de brocas",
  belt: "Banda industrial",
  bolt: "Tornillería",
  nut: "Tuerca",
  washer: "Rondana",
  die: "Tarraja",
  socket: "Dado",
  clamp: "Abrazadera",
  generic: "Pieza industrial",
}

const normalizeProductText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")

export const getProductModelKind = (
  product: Pick<Product, "name" | "category">,
): ProductModelKind => {
  const name = normalizeProductText(product.name)
  const category = normalizeProductText(product.category?.name ?? "")

  if (name.includes("juego") && name.includes("broca")) {
    return "drill-set"
  }
  if (name.includes("broca")) {
    return "drill"
  }
  if (name.includes("machuel")) {
    return "tap"
  }
  if (
    name.includes("cortador") ||
    name.includes("avellanador") ||
    name.includes("moleteador")
  ) {
    return "endmill"
  }
  if (name.includes("banda")) {
    return "belt"
  }
  if (name.includes("tuerca")) {
    return "nut"
  }
  if (name.includes("rondana") || name.includes("arandela")) {
    return "washer"
  }
  if (name.includes("tarraja")) {
    return "die"
  }
  if (
    name.includes("tornillo") ||
    name.includes("perno") ||
    name.includes("pija") ||
    name.includes("varilla")
  ) {
    return "bolt"
  }
  if (
    name.includes("dado") ||
    name.includes("broquero") ||
    name.includes("boquilla")
  ) {
    return "socket"
  }
  if (name.includes("abrazadera")) {
    return "clamp"
  }

  if (category.includes("transmision")) {
    return "belt"
  }
  if (category.includes("carburo")) {
    return "endmill"
  }
  if (category.includes("perforacion")) {
    return "drill"
  }
  if (category.includes("tornilleria")) {
    return "bolt"
  }
  if (category.includes("roscado")) {
    return "die"
  }

  return "generic"
}

export const getProductModelLabel = (kind: ProductModelKind) =>
  MODEL_LABELS[kind]
