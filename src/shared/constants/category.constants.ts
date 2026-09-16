import { CATEGORY_SEO } from "@/shared/constants/seo.constants"

export const CATEGORY_PAGE_HREFS: Record<string, string> = {
  tornilleria: "/categorias/tornilleria-fijacion",
  abrasivos: "/categorias/abrasivos",
  "herramientas-impacto-forja": "/categorias/impacto-forja",
  "herramientas-corte-conformado": "/categorias/herramientas-corte-conformado",
  "perforacion-accesorios-taladro": "/categorias/perforacion-accesorios-taladro",
}

export const getCategoryIdBySlug = (slug: string): string | undefined =>
  Object.keys(CATEGORY_PAGE_HREFS).find(
    (id) => CATEGORY_PAGE_HREFS[id] === `/categorias/${slug}`,
  )

export type CategoryPageConfig = {
  name: string
  heading: string
  intro: string
  searchPlaceholder: string
}

export const CATEGORY_PAGES: Record<string, CategoryPageConfig> = {
  tornilleria: {
    name: "Tornillería",
    heading: "Tornillería y fijación industrial",
    intro:
      "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla.",
    searchPlaceholder: "Buscar tornillos, tuercas, pernos...",
  },
  abrasivos: {
    name: "Abrasivos",
    heading: "Abrasivos industriales",
    intro: CATEGORY_SEO.abrasivos.description,
    searchPlaceholder: "Buscar discos, puntas montadas...",
  },
  "herramientas-impacto-forja": {
    name: "Herramientas de impacto o forja",
    heading: "Herramientas de impacto y forja",
    intro: CATEGORY_SEO["herramientas-impacto-forja"].description,
    searchPlaceholder: "Buscar martillos, mazos, cinceles...",
  },
  "herramientas-corte-conformado": {
    name: "Herramientas de corte y conformado",
    heading: "Herramientas de corte y conformado",
    intro: CATEGORY_SEO["herramientas-corte-conformado"].description,
    searchPlaceholder: "Buscar machuelos, buriles, cortadores...",
  },
  "perforacion-accesorios-taladro": {
    name: "Perforación y accesorios para taladro",
    heading: "Perforación y accesorios de taladro",
    intro: CATEGORY_SEO["perforacion-accesorios-taladro"].description,
    searchPlaceholder: "Buscar brocas, juegos, portabrocas...",
  },
}

export const SUBCATEGORY_LABELS: Record<string, string> = {
  nudo: "Nudos",
  opresor: "Opresores",
  perno: "Pernos",
  pija: "Pijas",
  remache: "Remaches",
  rondana: "Rondanas",
  taquete: "Taquetes",
  tornillos: "Tornillos",
  tuerca: "Tuercas",
  varilla: "Varilla roscada",
}
