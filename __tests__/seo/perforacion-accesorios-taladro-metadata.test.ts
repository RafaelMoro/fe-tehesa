/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/perforacion-accesorios-taladro/page"
import {
  PERFORACION_DESCRIPTION,
  PERFORACION_TITLE,
} from "@/shared/constants/seo.constants"

describe("categorias/perforacion-accesorios-taladro generateMetadata", () => {
  it("marks the route index, follow with a /categorias/perforacion-accesorios-taladro canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(PERFORACION_TITLE)
    expect(metadata.description).toBe(PERFORACION_DESCRIPTION)
    expect(metadata.alternates).toEqual({
      canonical: "/categorias/perforacion-accesorios-taladro",
    })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
