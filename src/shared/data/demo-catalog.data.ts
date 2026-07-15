import type {
  CatalogMode,
  Product,
  ProductVariant,
  TaxonomyItem,
} from "@/shared/types/global.types"

const DEMO_VARIANTS: Record<string, ProductVariant[]> = {
  "demo-volkel-machuelo": [
    { internalId: "VO-30101", diameter: '1/4"', pricing: { price: 684 } },
    { internalId: "VO-30103", diameter: '3/8"', pricing: { price: 829 } },
    { internalId: "VO-30105", diameter: '1/2"', pricing: { price: 1099 } },
  ],
  "demo-weston-cortador": [
    { internalId: "WE-CV4-6", diameter: "6 mm", pricing: { price: 531 } },
    { internalId: "WE-CV4-8", diameter: "8 mm", pricing: { price: 790 } },
    { internalId: "WE-CV4-10", diameter: "10 mm", pricing: { price: 1230 } },
  ],
  "demo-firestone-banda": [
    { internalId: "FS-A40", diameter: "A-40", pricing: { price: 372 } },
    { internalId: "FS-A42", diameter: "A-42", pricing: { price: 496 } },
    { internalId: "FS-A45", diameter: "A-45", pricing: { price: 718 } },
  ],
  "demo-truper-brocas": [
    { internalId: "TR-COB-8", diameter: "8 piezas", pricing: { price: 899 } },
    {
      internalId: "TR-COB-13",
      diameter: "13 piezas",
      pricing: { price: 1099 },
    },
    {
      internalId: "TR-COB-21",
      diameter: "21 piezas",
      pricing: { price: 1490 },
    },
  ],
}

export const DEMO_PRODUCTS: Product[] = [
  {
    name: "Machuelo máquina HSS-E para agujero ciego",
    documentId: "demo-volkel-machuelo",
    category: { name: "Herramientas de corte y conformado" },
    brand: { name: "VÖLKEL" },
    minPrice: 684,
    maxPrice: 1099,
    variantCount: 3,
    product_variants: DEMO_VARIANTS["demo-volkel-machuelo"],
  },
  {
    name: "Cortador vertical de carburo 4 filos",
    documentId: "demo-weston-cortador",
    category: { name: "Carburo" },
    brand: { name: "Weston" },
    minPrice: 531,
    maxPrice: 1230,
    variantCount: 3,
    product_variants: DEMO_VARIANTS["demo-weston-cortador"],
  },
  {
    name: "Banda industrial de transmisión sección A",
    documentId: "demo-firestone-banda",
    category: { name: "Transmisión de potencia" },
    brand: { name: "Firestone" },
    minPrice: 372,
    maxPrice: 718,
    variantCount: 3,
    product_variants: DEMO_VARIANTS["demo-firestone-banda"],
  },
  {
    name: "Juego de brocas de cobalto para metal",
    documentId: "demo-truper-brocas",
    category: { name: "Perforación y accesorios para taladro" },
    brand: { name: "Truper" },
    minPrice: 899,
    maxPrice: 1490,
    variantCount: 3,
    product_variants: DEMO_VARIANTS["demo-truper-brocas"],
  },
]

export const DEMO_CATEGORIES: TaxonomyItem[] = [
  {
    name: "Herramientas de corte y conformado",
    customId: "demo-cutting-tools",
  },
  { name: "Carburo", customId: "demo-carbide" },
  { name: "Transmisión de potencia", customId: "demo-power-transmission" },
  {
    name: "Perforación y accesorios para taladro",
    customId: "demo-drilling",
  },
]

export const DEMO_BRANDS: TaxonomyItem[] = [
  { name: "VÖLKEL", customId: "demo-volkel" },
  { name: "Weston", customId: "demo-weston" },
  { name: "Firestone", customId: "demo-firestone" },
  { name: "Truper", customId: "demo-truper" },
]

export const getDemoProducts = ({
  mode,
  value,
  page,
}: {
  mode: CatalogMode
  value: string | null
  page: number
}): Product[] => {
  if (page > 1) {
    return []
  }

  const normalizedValue = value?.trim().toLocaleLowerCase("es-MX") ?? ""
  if (mode === "base" || !normalizedValue) {
    return DEMO_PRODUCTS
  }

  return DEMO_PRODUCTS.filter((product) => {
    if (mode === "name") {
      return product.name.toLocaleLowerCase("es-MX").includes(normalizedValue)
    }
    if (mode === "category") {
      return (
        product.category?.name.toLocaleLowerCase("es-MX") === normalizedValue
      )
    }
    return product.brand?.name.toLocaleLowerCase("es-MX") === normalizedValue
  })
}

export const getDemoProductVariants = (documentId: string) =>
  DEMO_VARIANTS[documentId]
