/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/page"
import { CATEGORIES_DESCRIPTION, CATEGORIES_TITLE } from "@/shared/constants/seo.constants"

describe("categorias generateMetadata", () => {
  it("marks the route index, follow with a /categorias canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(CATEGORIES_TITLE)
    expect(metadata.description).toBe(CATEGORIES_DESCRIPTION)
    expect(metadata.alternates).toEqual({ canonical: "/categorias" })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
