/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/impacto-forja/page"
import {
  IMPACTO_FORJA_DESCRIPTION,
  IMPACTO_FORJA_TITLE,
} from "@/shared/constants/seo.constants"

describe("categorias/impacto-forja generateMetadata", () => {
  it("marks the route index, follow with a /categorias/impacto-forja canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(IMPACTO_FORJA_TITLE)
    expect(metadata.description).toBe(IMPACTO_FORJA_DESCRIPTION)
    expect(metadata.alternates).toEqual({
      canonical: "/categorias/impacto-forja",
    })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
