import type { Metadata } from "next"

import {
  buildCanonicalPath,
  parseCatalogParams,
} from "@/features/Pagination/utils.pagination"
import type {
  CatalogUrlState,
  MainPageSearchParams,
} from "@/features/Pagination/types.pagination"
import {
  SITE_DESCRIPTION,
  SITE_TITLE,
  TITLE_BASE,
  TITLE_TAXONOMY_SUFFIX,
} from "@/shared/constants/seo.constants"

const CATEGORY_LABEL = "categoría"
const BRAND_LABEL = "marca"

const buildTitle = (state: CatalogUrlState): string => {
  const pageSuffix = state.page > 1 ? ` | Pagina ${state.page}` : ""

  if (state.mode === "base") {
    return state.page === 1
      ? SITE_TITLE
      : `${TITLE_BASE}${pageSuffix} | Tehesa`
  }

  if (state.mode === "name") {
    return `Resultados para "${state.value}"${pageSuffix} | Tehesa`
  }

  return `${state.value} | ${TITLE_TAXONOMY_SUFFIX}${pageSuffix} | Tehesa`
}

const buildDescription = (state: CatalogUrlState): string => {
  if (state.mode === "base") {
    return SITE_DESCRIPTION
  }

  if (state.mode === "name") {
    return `Resultados de búsqueda para "${state.value}" en el catálogo de Tehesa.`
  }

  const label = state.mode === "category" ? CATEGORY_LABEL : BRAND_LABEL
  return `Productos de la ${label} ${state.value} en el catálogo industrial de Tehesa.`
}

export const buildCatalogMetadata = (
  params: MainPageSearchParams,
): Metadata => {
  const state = parseCatalogParams(params)

  if (state === null) {
    return {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const title = buildTitle(state)
  const description = buildDescription(state)
  const canonical = buildCanonicalPath(state)

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: state.mode !== "name",
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
    twitter: {
      title,
      description,
    },
  }
}
