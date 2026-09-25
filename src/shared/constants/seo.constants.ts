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
  "Tornillería, brocas, herramienta de corte, llaves y equipo de seguridad. 17 categorías con existencia en Puebla. Cotiza por WhatsApp."
export const BRANDS_TITLE = "Marcas de Herramienta Industrial en Puebla | Tehesa"
export const BRANDS_DESCRIPTION =
  "Weston, Völkel, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con existencia en Puebla. Explora el catálogo por marca y cotiza por WhatsApp."
export type CategorySeo = { title: string; description: string }

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  tornilleria: {
    title: "Tornillería y Fijación Industrial en Puebla | Tehesa",
    description:
      "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla. Cotiza hoy.",
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
    title: "Llaves, Dados y Herramientas de Apriete en Puebla | Tehesa",
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
    title: "Extractores de Tornillos y Reparación en Puebla | Tehesa",
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
  "herramientas-marcado": {
    title: "Marcadores y Herramientas de Marcado Industrial | Tehesa Puebla",
    description:
      "Marcadores de pintura Weston y herramienta de marcado para identificar piezas en taller e industria. Existencia en Puebla. Cotiza hoy.",
  },
  "sellado-taponado": {
    title: "Tapones y Sellado Industrial en Puebla | Tehesa Industrial",
    description:
      "Tapones roscados y soluciones de sellado y taponado para líneas y equipo industrial. Existencia en Puebla. Cotiza con Tehesa Industrial.",
  },
}

export type BrandSeo = CategorySeo & { heading: string }

export const BRAND_SEO: Record<string, BrandSeo> = {
  weston: {
    title: "Weston en Puebla — Herramienta Industrial Mexicana | Tehesa",
    description:
      "Distribuidor de Weston en Puebla: cortadores, brocas, machuelos y rimas para la industria. Marca mexicana con +30 años. Cotiza con Tehesa.",
    heading: "Weston: la marca mexicana para la industria",
  },
  volkel: {
    title: "Völkel en Puebla — Machuelos y Herramienta de Roscado | Tehesa",
    description:
      "Distribuidor de Völkel en Puebla: machuelos, tarrajas y herramienta de roscado de fabricante alemán especializado. Cotiza con Tehesa Industrial.",
    heading: "Völkel: especialistas alemanes en roscado",
  },
  "king-tony": {
    title: "King Tony en Puebla — Dados y Llaves Profesionales | Tehesa",
    description:
      "Distribuidor de King Tony en Puebla. Dados, matracas y llaves de apriete bajo norma DIN y ANSI. Cotiza con Tehesa Industrial.",
    heading: "King Tony: apriete profesional bajo norma DIN y ANSI",
  },
  bohrcraft: {
    title: "Bohrcraft en Puebla — Brocas y Machuelos Alemanes | Tehesa",
    description:
      "Distribuidor directo de Bohrcraft en Puebla. Brocas y machuelos de precisión alemana para industria. Cotiza con Tehesa.",
    heading: "Bohrcraft: precisión alemana en brocas y machuelos",
  },
  bondhus: {
    title: "Bondhus en Puebla — Llaves Hexagonales Made in USA | Tehesa",
    description:
      "Distribuidor de Bondhus en Puebla. Llaves hexagonales y Torx hechas en EUA, inventoras de la punta de bola. Cotiza con Tehesa.",
    heading: "Bondhus: el inventor de la llave de punta de bola",
  },
  precision: {
    title: "Precision Brand en Puebla — Laina de Precisión | Tehesa",
    description:
      "Distribuidor de Precision Brand en Puebla. Laina en rollo para alineación de maquinaria y ajuste de troqueles. Cotiza con Tehesa.",
    heading: "Precision Brand: laina para alinear y ajustar con exactitud",
  },
  cleveland: {
    title: "Cleveland en Puebla — Buriles y Machuelos de Cobalto | Tehesa",
    description:
      "Distribuidor de Cleveland en Puebla. Buriles de cobalto K-42 y machuelos para maquinado industrial. Cotiza con Tehesa Industrial.",
    heading: "Cleveland: 150 años de herramienta de corte",
  },
}
