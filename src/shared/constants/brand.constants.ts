import { BRAND_SEO } from "./seo.constants"

export const BRAND_PAGE_HREFS: Record<string, string> = {
  weston: "/marcas/weston",
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

export type BrandPageConfig = {
  name: string
  origin: string
  identity: string
  stock: string
  tags: string[]
}

// Insertion order is the card render order (D5: live product-count desc,
// 90/26/19/13/6/5) — edit this together with BrandsPage's "Seis" hero copy.
export const BRAND_PAGES: Record<string, BrandPageConfig> = {
  weston: {
    name: "WESTON",
    origin: "Monterrey, México · +30 años",
    identity: "La marca mexicana para la industria; la línea más amplia del almacén.",
    stock:
      "Cortadores verticales de acero A.V., cobalto y carburo, brocas y broqueros, machuelos y rimas, avellanadores, calibradores de cuerda, limas rotativas y diamantadas, clamps y discos de corte.",
    tags: ["Cortadores", "Brocas", "Machuelos", "Discos"],
  },
  "king-tony": {
    name: "KING TONY",
    origin: "Taichung, Taiwán · desde 1976",
    identity: "Apriete profesional bajo norma DIN y ANSI.",
    stock:
      "Dados de 1/2\" en estrella, bristol, torx, ribe y spline, dados de impacto, matracas, llaves combinadas de matraca, llaves de golpe y de gancho, pinzas de presión y martillos.",
    tags: ["Dados", "Matracas", "Llaves", "Pinzas"],
  },
  bohrcraft: {
    name: "BOHRCRAFT",
    origin: "Remscheid, Alemania · desde 1975",
    identity: "Herramienta de corte alemana para trabajos de tolerancia cerrada.",
    stock:
      "Brocas de acero A.V., cobalto y carburo sólido TiAlN, juegos de brocas, machuelos A.V., BSP, NPT y STI, dados de tarraja, insertos roscados y kits reparadores de rosca.",
    tags: ["Brocas", "Machuelos", "Tarrajas", "Roscas"],
  },
  bondhus: {
    name: "BONDHUS",
    origin: "Monticello, Minnesota · desde 1964",
    identity:
      "Inventor de la llave hexagonal de punta de bola; hecha en EUA con garantía de por vida del fabricante.",
    stock:
      "Llaves hexagonales milimétricas y estándar, cortas y largas, punta de bola, y llaves Torx cortas y largas.",
    tags: ["Hexagonales", "Punta de bola", "Torx"],
  },
  precision: {
    name: "PRECISION BRAND",
    origin: "Downers Grove, Illinois · desde 1940",
    identity:
      "Laina de acero para alinear maquinaria, montar motores y bombas y ajustar troqueles.",
    stock:
      "Rollos en acero azul templado, acero al carbón y acero inoxidable — 6\" × 50\" y 100\", 150 mm × 1.25 m y 2.5 m — en varios espesores.",
    tags: ["Laina", "Alineación", "Troqueles"],
  },
  cleveland: {
    name: "CLEVELAND",
    origin: "Cleveland Twist Drill, EUA · desde 1876",
    identity: "Ciento cincuenta años haciendo herramienta de corte.",
    stock:
      "Buriles cuadrados de cobalto y buriles K-42 en 35 medidas, juegos de machuelos AAC y AAV y machuelos NPT.",
    tags: ["Buriles", "Cobalto", "Machuelos"],
  },
}
