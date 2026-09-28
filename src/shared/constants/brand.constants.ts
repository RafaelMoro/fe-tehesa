import { BRAND_SEO } from "./seo.constants"

export const BRAND_PAGE_HREFS: Record<string, string> = {
  weston: "/marcas/weston",
  volkel: "/marcas/volkel",
  "king-tony": "/marcas/king-tony",
  bohrcraft: "/marcas/bohrcraft",
  bondhus: "/marcas/bondhus",
  precision: "/marcas/precision",
  cleveland: "/marcas/cleveland",
}

export const getBrandIdBySlug = (slug: string): string | undefined =>
  Object.keys(BRAND_PAGE_HREFS).find(
    (id) => BRAND_PAGE_HREFS[id] === `/marcas/${slug}`,
  )

export const getBrandDisplayName = (customId: string): string | undefined =>
  BRAND_SEO[customId]?.heading.split(":")[0].trim()

export type BrandLogo = {
  src: string
  width: number
  height: number
  background: string
}

export type BrandPageConfig = {
  name: string
  origin: string
  identity: string
  stock: string
  tags: string[]
  logo: BrandLogo
}

const CLOUDINARY_BASE = "https://res.cloudinary.com/dov7g4avx/image/upload/"

// Insertion order drives only Home's BrandStrip (live product-count desc,
// 96/60/25/18/15/6/5). /marcas uses BRANDS_INDEX_ORDER below instead.
export const BRAND_PAGES: Record<string, BrandPageConfig> = {
  weston: {
    name: "WESTON",
    origin: "Monterrey, México · +30 años",
    identity: "La marca mexicana para la industria; la línea más amplia del almacén.",
    stock:
      "Cortadores verticales de acero A.V., cobalto y carburo, brocas y broqueros, machuelos y rimas, avellanadores, calibradores de cuerda, limas rotativas y diamantadas, clamps y discos de corte.",
    tags: ["Cortadores", "Brocas", "Machuelos", "Discos"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362301/weston-logo_cwahti.webp`,
      width: 250,
      height: 80,
      background: "#141414",
    },
  },
  volkel: {
    name: "VÖLKEL",
    origin: "Remscheid, Alemania · desde 1915",
    identity: "Fabricante alemán dedicado por entero al roscado desde hace más de un siglo.",
    stock:
      "Machuelos y tarrajas para cortar rosca a la medida, una de las líneas más completas del catálogo.",
    tags: ["Machuelos", "Tarrajas", "Roscado"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362300/volkel-logo_trxl3c.webp`,
      width: 105,
      height: 32,
      background: "#003f7d",
    },
  },
  "king-tony": {
    name: "KING TONY",
    origin: "Taichung, Taiwán · desde 1976",
    identity: "Apriete profesional bajo norma DIN y ANSI.",
    stock:
      "Dados de 1/2\" en estrella, bristol, torx, ribe y spline, dados de impacto, matracas, llaves combinadas de matraca, llaves de golpe y de gancho, pinzas de presión y martillos.",
    tags: ["Dados", "Matracas", "Llaves", "Pinzas"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362298/king-tony-logo_mdqyej.webp`,
      width: 288,
      height: 76,
      background: "#d7141a",
    },
  },
  bohrcraft: {
    name: "BOHRCRAFT",
    origin: "Remscheid, Alemania · desde 1975",
    identity: "Herramienta de corte alemana para trabajos de tolerancia cerrada.",
    stock:
      "Brocas de acero A.V., cobalto y carburo sólido TiAlN, juegos de brocas, machuelos A.V., BSP, NPT y STI, dados de tarraja, insertos roscados y kits reparadores de rosca.",
    tags: ["Brocas", "Machuelos", "Tarrajas", "Roscas"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362297/bohrcraft-logo_qhptej.webp`,
      width: 173,
      height: 105,
      background: "#ffffff",
    },
  },
  bondhus: {
    name: "BONDHUS",
    origin: "Monticello, Minnesota · desde 1964",
    identity:
      "Inventor de la llave hexagonal de punta de bola; hecha en EUA con garantía de por vida del fabricante.",
    stock:
      "Llaves hexagonales milimétricas y estándar, cortas y largas, punta de bola, y llaves Torx cortas y largas.",
    tags: ["Hexagonales", "Punta de bola", "Torx"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362297/bhondus-logo_gun8z7.webp`,
      width: 250,
      height: 64,
      background: "#ffffff",
    },
  },
  precision: {
    name: "PRECISION BRAND",
    origin: "Downers Grove, Illinois · desde 1940",
    identity:
      "Laina de acero para alinear maquinaria, montar motores y bombas y ajustar troqueles.",
    stock:
      "Rollos en acero azul templado, acero al carbón y acero inoxidable — 6\" × 50\" y 100\", 150 mm × 1.25 m y 2.5 m — en varios espesores.",
    tags: ["Laina", "Alineación", "Troqueles"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362299/precision-brand-logo_sylhpn.webp`,
      width: 260,
      height: 70,
      background: "#ffffff",
    },
  },
  cleveland: {
    name: "CLEVELAND",
    origin: "Cleveland Twist Drill, EUA · desde 1876",
    identity: "Ciento cincuenta años haciendo herramienta de corte.",
    stock:
      "Buriles cuadrados de cobalto y buriles K-42 en 35 medidas, juegos de machuelos AAC y AAV y machuelos NPT.",
    tags: ["Buriles", "Cobalto", "Machuelos"],
    logo: {
      src: `${CLOUDINARY_BASE}v1790362298/cleveland-logo_l78txe.webp`,
      width: 1902,
      height: 2272,
      background: "#ffffff",
    },
  },
}

// /marcas only (UI/product I): the featured brand renders in its own panel and is not in this list.
// A brand added to BRAND_PAGES must also be added here to appear on /marcas.
export const BRANDS_FEATURED_ID = "bohrcraft"
export const BRANDS_INDEX_ORDER: string[] = ["weston", "king-tony", "bondhus", "precision", "cleveland", "volkel"]

// Temporary storefront photo (D3). Replace src and alt together.
export const BRANDS_HERO_PHOTO = {
  src: `${CLOUDINARY_BASE}v1790362578/tehesa-temp-image_ujtodk.webp`,
  alt: "Fachada de la tienda Tehesa Industrial en Puebla",
  width: 1787,
  height: 880,
}
