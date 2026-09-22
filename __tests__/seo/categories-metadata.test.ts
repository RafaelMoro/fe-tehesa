/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/page"

describe("categorias generateMetadata", () => {
  it("marks the route index, follow with a /categorias canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe("Catálogo de Herramienta Industrial en Puebla | Tehesa")
    expect(metadata.description).toBe(
      "Tornillería, brocas, herramienta de corte, llaves y equipo de seguridad. 17 categorías con existencia en Puebla. Cotiza por WhatsApp.",
    )
    expect(metadata.alternates).toEqual({ canonical: "/categorias" })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })
})
