/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/herramientas-corte-conformado/page"
import {
  CORTE_CONFORMADO_DESCRIPTION,
  CORTE_CONFORMADO_TITLE,
} from "@/shared/constants/seo.constants"

describe("categorias/herramientas-corte-conformado generateMetadata", () => {
  it("marks the route index, follow with a /categorias/herramientas-corte-conformado canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(CORTE_CONFORMADO_TITLE)
    expect(metadata.description).toBe(CORTE_CONFORMADO_DESCRIPTION)
    expect(metadata.alternates).toEqual({
      canonical: "/categorias/herramientas-corte-conformado",
    })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
