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
export const BRANDS_TITLE = "Marcas de Herramienta Industrial en Puebla | Tehesa"
export const BRANDS_DESCRIPTION =
  "Weston, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con existencia en Puebla. Explora el catálogo por marca y cotiza por WhatsApp."
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
  "llaves-herramientas-apriete": {
    title: "Llaves, Dados y Herramientas de Apriete | Tehesa Industrial",
    description:
      "Dados, llaves, puntas y bristol King Tony para industria y taller. Existencia en Puebla. Solicita cotización con Tehesa Industrial.",
  },
  "roscado-herramientas-roscas": {
    title: "Machuelos, Terrajas y Herramientas de Roscado | Tehesa Puebla",
    description:
      "Machuelos, terrajas y juegos de roscado Bohrcraft para industria y taller. Distribuidor directo en Puebla. Cotiza por WhatsApp.",
  },
  carburo: {
    title: "Limas Diamantadas y Herramientas de Carburo | Tehesa Puebla",
    description:
      "Limas diamantadas, puntas de diamante, limas rotativas y cortadores de carburo. Precisión industrial en Puebla. Cotiza hoy.",
  },
  sujecion: {
    title: "Clamps y Herramientas de Sujeción Industrial | Tehesa Puebla",
    description:
      "Clamps verticales, horizontales y de jalar para sujeción industrial. Existencia en Puebla. Cotiza con Tehesa Industrial.",
  },
  calibrador: {
    title: "Calibradores Industriales en Puebla | Tehesa Industrial",
    description:
      "Calibradores y cuenta hilos para medición industrial de precisión. Existencia en Puebla. Solicita tu cotización.",
  },
  "extraccion-reparacion-fijaciones": {
    title: "Extractores de Tornillos y Reparación de Fijaciones | Tehesa",
    description:
      "Extractores de tornillos y manerales para reparación de fijaciones. Distribuidor industrial en Puebla. Solicita tu cotización.",
  },
  "adhesivos-selladores": {
    title: "Adhesivos y Selladores Industriales en Puebla | Tehesa",
    description:
      "Adhesivos y selladores para fijación y sellado industrial. Abasto en Puebla. Cotiza con Tehesa Industrial.",
  },
  "equipo-seguridad": {
    title: "Equipo de Seguridad Industrial en Puebla | Tehesa Industrial",
    description:
      "Lentes y equipo de seguridad para entornos industriales. Existencia en Puebla. Cotiza con Tehesa Industrial.",
  },
  "herramientas-diagnostico-electricidad": {
    title:
      "Probadores y Herramientas de Diagnóstico Eléctrico | Tehesa Puebla",
    description:
      "Probadores eléctricos y herramienta de diagnóstico para electricidad y electrónica industrial. Puebla. Solicita tu cotización.",
  },
  "herrajes-accesorios-cable": {
    title: "Herrajes y Accesorios para Cable en Puebla | Tehesa Industrial",
    description:
      "Herrajes y accesorios para cable de acero en aplicaciones industriales. Existencia en Puebla. Cotiza hoy.",
  },
  "lubricantes-multifuncionales": {
    title: "Lubricantes Multifuncionales Industriales | Tehesa Puebla",
    description:
      "Lubricantes multifuncionales para mantenimiento industrial y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.",
  },
}
