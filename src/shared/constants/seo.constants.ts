export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
export const SITE_NAME = "Tehesa"
export const SITE_TITLE = "Herramienta Industrial y Tornillería en Puebla | Tehesa"
export const SITE_DESCRIPTION =
  "Distribuidores directos de Bohrcraft, King Tony y Cleveland en Puebla. Tornillería, brocas y herramienta de corte. Cotiza por WhatsApp."
export const SITE_LOCALE = "es_MX"
export const TITLE_BASE = "Herramienta Industrial y Tornillería en Puebla"
export const TITLE_TAXONOMY_SUFFIX = "Herramienta industrial en Puebla"
export const QUOTE_TITLE = "Solicita tu Cotización | Tehesa Industrial Puebla"
export const QUOTE_DESCRIPTION =
  "Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla."
export const CATEGORIES_TITLE = "Catálogo de Herramienta Industrial en Puebla | Tehesa"
export const CATEGORIES_DESCRIPTION =
  "Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp."
export type CategorySeo = { title: string; description: string }

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  tornilleria: {
    title: "Tornillería y Fijación Industrial en Puebla | Tehesa",
    description:
      "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla. Cotiza hoy.",
  },
  abrasivos: {
    title: "Discos de Corte y Abrasivos Industriales en Puebla | Tehesa",
    description:
      "Discos de corte y puntas montadas para desbaste industrial. Abasto en Puebla. Cotiza con Tehesa Industrial.",
  },
  "herramientas-impacto-forja": {
    title: "Martillos y Herramientas de Impacto y Forja | Tehesa Puebla",
    description:
      "Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.",
  },
  "herramientas-corte-conformado": {
    title: "Herramientas de Corte y Machuelos en Puebla | Tehesa",
    description:
      "Machuelos, buriles, cortadores y herramienta de corte para torno y maquinado. Marcas de calidad en Puebla. Solicita tu cotización.",
  },
  "perforacion-accesorios-taladro": {
    title: "Brocas Industriales y Perforación en Puebla | Tehesa",
    description:
      "Brocas Bohrcraft, juegos y accesorios de perforación para industria. Distribuidor directo en Puebla. Cotiza por WhatsApp.",
  },
}
