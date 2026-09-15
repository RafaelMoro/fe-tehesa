export const TORNILLERIA_CATEGORY_ID = "tornilleria"

export const CATEGORY_PAGE_HREFS: Record<string, string> = {
  [TORNILLERIA_CATEGORY_ID]: "/categorias/tornilleria-fijacion",
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
