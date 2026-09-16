import {
  ABRASIVOS_DESCRIPTION,
  IMPACTO_FORJA_DESCRIPTION,
} from "@/shared/constants/seo.constants"

export const TORNILLERIA_CATEGORY_ID = "tornilleria"
export const ABRASIVOS_CATEGORY_ID = "abrasivos"
export const IMPACTO_FORJA_CATEGORY_ID = "herramientas-impacto-forja"

export const CATEGORY_PAGE_HREFS: Record<string, string> = {
  [TORNILLERIA_CATEGORY_ID]: "/categorias/tornilleria-fijacion",
  [ABRASIVOS_CATEGORY_ID]: "/categorias/abrasivos",
  [IMPACTO_FORJA_CATEGORY_ID]: "/categorias/impacto-forja",
}

export type CategoryPageConfig = {
  name: string
  heading: string
  intro: string
  searchPlaceholder: string
}

export const CATEGORY_PAGES: Record<string, CategoryPageConfig> = {
  [TORNILLERIA_CATEGORY_ID]: {
    name: "Tornillería",
    heading: "Tornillería y fijación industrial",
    intro:
      "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla.",
    searchPlaceholder: "Buscar tornillos, tuercas, pernos...",
  },
  [ABRASIVOS_CATEGORY_ID]: {
    name: "Abrasivos",
    heading: "Abrasivos industriales",
    intro: ABRASIVOS_DESCRIPTION,
    searchPlaceholder: "Buscar discos, puntas montadas...",
  },
  [IMPACTO_FORJA_CATEGORY_ID]: {
    name: "Herramientas de impacto o forja",
    heading: "Herramientas de impacto y forja",
    intro: IMPACTO_FORJA_DESCRIPTION,
    searchPlaceholder: "Buscar martillos, mazos, cinceles...",
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
