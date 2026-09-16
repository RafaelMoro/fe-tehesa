/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/cotizar/page"

describe("cotizar generateMetadata", () => {
  it("marks the route noindex, follow with a /cotizar canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe("Solicita tu Cotización | Tehesa Industrial Puebla")
    expect(metadata.description).toBe(
      "Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla.",
    )
    expect(metadata.alternates).toEqual({ canonical: "/cotizar" })
    expect(metadata.robots).toEqual({ index: false, follow: true })
  })
})
