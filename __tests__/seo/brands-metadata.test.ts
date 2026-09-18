/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/marcas/page"

describe("marcas generateMetadata", () => {
  it("marks the route index, follow with a /marcas canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe("Marcas de Herramienta Industrial en Puebla | Tehesa")
    expect(metadata.description).toBe(
      "Weston, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con existencia en Puebla. Explora el catálogo por marca y cotiza por WhatsApp.",
    )
    expect(metadata.alternates).toEqual({ canonical: "/marcas" })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
