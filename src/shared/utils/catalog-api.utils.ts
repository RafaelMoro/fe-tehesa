const SPANISH_COPY: Record<string, string> = {
  CAT_ENV_001: 'No se pudo conectar con el catálogo. Inténtalo de nuevo más tarde.',
  CAT_VAL_001: 'Página inválida.',
  CAT_VAL_002: 'Tamaño de página inválido.',
  CAT_VAL_003: 'Categoría inválida.',
  CAT_VAL_004: 'Marca inválida.',
  CAT_VAL_005: 'Producto inválido.',
  CAT_VAL_006: 'Revisa el texto de búsqueda e inténtalo de nuevo.',
  CAT_NF_001: 'No se encontró la categoría seleccionada.',
  CAT_NF_002: 'No se encontró la marca seleccionada.',
  CAT_NF_003: 'No se encontró el producto.',
  CAT_ERR_001: 'No se pudo cargar el catálogo. Inténtalo de nuevo.',
}

export type CatalogEnvelope<T> =
  | { success: true; data: T }
  | { success: false; code: string; message: string }

export class CatalogApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export const fetchCatalog = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, init)
  const body = (await res.json()) as CatalogEnvelope<T>
  if (!body.success) {
    throw new CatalogApiError(body.code, body.message)
  }
  return body.data
}

export const catalogErrorToSpanish = (code: string): string =>
  SPANISH_COPY[code] ?? 'No se pudo completar la operación. Inténtalo de nuevo.'
