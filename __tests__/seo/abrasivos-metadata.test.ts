/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/abrasivos/page"
import {
  ABRASIVOS_DESCRIPTION,
  ABRASIVOS_TITLE,
} from "@/shared/constants/seo.constants"

describe("categorias/abrasivos generateMetadata", () => {
  it("marks the route index, follow with a /categorias/abrasivos canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(ABRASIVOS_TITLE)
    expect(metadata.description).toBe(ABRASIVOS_DESCRIPTION)
    expect(metadata.alternates).toEqual({
      canonical: "/categorias/abrasivos",
    })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
