/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/impacto-forja/page"
import { IMPACTO_FORJA_TITLE } from "@/shared/constants/seo.constants"

describe("categorias/impacto-forja generateMetadata", () => {
  it("marks the route index, follow with a /categorias/impacto-forja canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(IMPACTO_FORJA_TITLE)
    expect(metadata.description).toBe(
      "Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.",
    )
    expect(metadata.alternates).toEqual({
      canonical: "/categorias/impacto-forja",
    })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
