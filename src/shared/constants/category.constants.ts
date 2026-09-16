export const CATEGORY_PAGE_HREFS: Record<string, string> = {
  tornilleria: "/categorias/tornilleria-fijacion",
  abrasivos: "/categorias/abrasivos",
  "herramientas-impacto-forja": "/categorias/impacto-forja",
  "herramientas-corte-conformado": "/categorias/herramientas-corte-conformado",
  "perforacion-accesorios-taladro": "/categorias/perforacion-accesorios-taladro",
  "llaves-herramientas-apriete": "/categorias/llaves-herramientas-apriete",
  "roscado-herramientas-roscas": "/categorias/roscado-herramientas-roscas",
  carburo: "/categorias/carburo",
  sujecion: "/categorias/sujecion",
  calibrador: "/categorias/calibrador",
  "extraccion-reparacion-fijaciones": "/categorias/extraccion-reparacion-fijaciones",
  "adhesivos-selladores": "/categorias/adhesivos-selladores",
  "equipo-seguridad": "/categorias/equipo-seguridad",
  "herramientas-diagnostico-electricidad": "/categorias/herramientas-diagnostico-electricidad",
  "herrajes-accesorios-cable": "/categorias/herrajes-accesorios-cable",
  "lubricantes-multifuncionales": "/categorias/lubricantes-multifuncionales",
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
      "Tornillos, tuercas, rondanas, pernos y varilla roscada en acero e inoxidable, por pieza o por caja. La base de cualquier ensamble o mantenimiento, con las medidas que la industria pide.",
    searchPlaceholder: "Buscar tornillos, tuercas, pernos...",
  },
  abrasivos: {
    name: "Abrasivos",
    heading: "Abrasivos industriales",
    intro:
      "Discos de corte, discos de desbaste y puntas montadas para esmeril y rectificado. Abrasivos que cortan parejo y duran en trabajo pesado.",
    searchPlaceholder: "Buscar discos, puntas montadas...",
  },
  "herramientas-impacto-forja": {
    name: "Herramientas de impacto o forja",
    heading: "Herramientas de impacto y forja",
    intro:
      "Martillos, marros y herramienta de hojalatería para golpear, formar y enderezar. Herramienta de impacto para taller y planta.",
    searchPlaceholder: "Buscar martillos, mazos, cinceles...",
  },
  "herramientas-corte-conformado": {
    name: "Herramientas de corte y conformado",
    heading: "Herramientas de corte y conformado",
    intro:
      "Machuelos, buriles y cortadores para torno, fresa y maquinado. Herramienta de corte que aguanta turnos completos sin perder filo.",
    searchPlaceholder: "Buscar machuelos, buriles, cortadores...",
  },
  "perforacion-accesorios-taladro": {
    name: "Perforación y accesorios para taladro",
    heading: "Perforación y accesorios de taladro",
    intro:
      "Brocas Bohrcraft, juegos y accesorios para taladro en metal, concreto y madera. Precisión alemana para perforar sin quemar la broca ni la pieza.",
    searchPlaceholder: "Buscar brocas, juegos, portabrocas...",
  },
  "llaves-herramientas-apriete": {
    name: "Llaves y herramientas de apriete",
    heading: "Llaves y herramientas de apriete",
    intro:
      "Dados, matracas, llaves combinadas, puntas y llaves bristol King Tony. Lo que necesita un taller o una línea de mantenimiento para apretar con el torque correcto sin barrer la tuerca.",
    searchPlaceholder: "Buscar dados, llaves, puntas...",
  },
  "roscado-herramientas-roscas": {
    name: "Roscado y herramientas para roscas",
    heading: "Roscado y herramientas para roscas",
    intro:
      "Machuelos, terrajas y juegos completos de roscado Bohrcraft, en métrico y estándar. Para hacer rosca nueva o rescatar una dañada con herramienta que no se despunta a la tercera pieza.",
    searchPlaceholder: "Buscar machuelos, terrajas, juegos...",
  },
  carburo: {
    name: "Carburo",
    heading: "Carburo y diamantados",
    intro:
      "Limas diamantadas, puntas de diamante, limas rotativas y cortadores de carburo para trabajar acero endurecido, fundición y materiales que una lima común no toca.",
    searchPlaceholder: "Buscar limas, puntas de diamante, cortadores...",
  },
  sujecion: {
    name: "Sujeción",
    heading: "Sujeción industrial",
    intro:
      "Clamps verticales, horizontales y de jalar para fijar piezas en soldadura, ensamble y maquinado. Sujeción rápida y repetible, sin improvisar con prensas.",
    searchPlaceholder: "Buscar clamps verticales, horizontales...",
  },
  calibrador: {
    name: "Calibrador",
    heading: "Calibradores",
    intro:
      "Calibradores y cuenta hilos para medir con precisión antes de cortar, roscar o rechazar una pieza. Herramienta de medición para control de calidad en piso y taller.",
    searchPlaceholder: "Buscar calibradores, cuenta hilos...",
  },
  "extraccion-reparacion-fijaciones": {
    name: "Extracción y Reparación de fijaciones",
    heading: "Extracción y reparación de fijaciones",
    intro:
      "Extractores de tornillos y manerales para sacar fijaciones barridas, rotas o corroídas sin dañar la pieza. Lo que resuelve el problema que detiene el mantenimiento.",
    searchPlaceholder: "Buscar extractores, manerales...",
  },
  "adhesivos-selladores": {
    name: "Adhesivos y selladores",
    heading: "Adhesivos y selladores",
    intro:
      "Adhesivos y selladores industriales para fijar roscas, sellar juntas y pegar donde un tornillo no cabe. Complemento directo de nuestra tornillería.",
    searchPlaceholder: "Buscar adhesivos, selladores...",
  },
  "equipo-seguridad": {
    name: "Equipo de seguridad",
    heading: "Equipo de seguridad industrial",
    intro:
      "Lentes y equipo de protección personal para taller y planta. Protección básica que cumple la norma y se compra en el mismo lugar que la herramienta.",
    searchPlaceholder: "Buscar lentes, equipo de seguridad...",
  },
  "herramientas-diagnostico-electricidad": {
    name: "Herramientas de diagnóstico de electricidad y electrónica",
    heading: "Diagnóstico de electricidad y electrónica",
    intro:
      "Probadores y herramienta de diagnóstico para revisar circuitos, continuidad y voltaje en instalaciones eléctricas y equipo electrónico industrial.",
    searchPlaceholder: "Buscar probadores, herramienta de diagnóstico...",
  },
  "herrajes-accesorios-cable": {
    name: "Herrajes y accesorios para cable",
    heading: "Herrajes y accesorios para cable",
    intro:
      "Herrajes y accesorios para cable de acero: sujeción, tensión y terminación en izaje, anclaje y aplicaciones industriales.",
    searchPlaceholder: "Buscar herrajes, accesorios para cable...",
  },
  "lubricantes-multifuncionales": {
    name: "Lubricantes multifuncionales",
    heading: "Lubricantes multifuncionales",
    intro:
      "Lubricantes multifuncionales para aflojar, proteger contra corrosión y lubricar piezas en mantenimiento industrial y de taller.",
    searchPlaceholder: "Buscar lubricantes...",
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
