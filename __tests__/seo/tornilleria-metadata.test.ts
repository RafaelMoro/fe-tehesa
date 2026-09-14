/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/tornilleria/page"
import {
  TORNILLERIA_DESCRIPTION,
  TORNILLERIA_TITLE,
} from "@/shared/constants/seo.constants"

describe("categorias/tornilleria generateMetadata", () => {
  it("marks the route index, follow with a /categorias/tornilleria canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(TORNILLERIA_TITLE)
    expect(metadata.description).toBe(TORNILLERIA_DESCRIPTION)
    expect(metadata.alternates).toEqual({
      canonical: "/categorias/tornilleria",
    })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
