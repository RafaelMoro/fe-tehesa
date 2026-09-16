/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/categorias/[slug]/page"

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

describe("categorias/[slug] generateMetadata", () => {
  it.each([
    [
      "tornilleria-fijacion",
      "Tornillería y Fijación Industrial en Puebla | Tehesa",
      "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla. Cotiza hoy.",
    ],
    [
      "abrasivos",
      "Discos de Corte y Abrasivos Industriales en Puebla | Tehesa",
      "Discos de corte y puntas montadas para desbaste industrial. Abasto en Puebla. Cotiza con Tehesa Industrial.",
    ],
    [
      "impacto-forja",
      "Martillos y Herramientas de Impacto y Forja | Tehesa Puebla",
      "Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.",
    ],
    [
      "herramientas-corte-conformado",
      "Herramientas de Corte y Machuelos en Puebla | Tehesa",
      "Machuelos, buriles, cortadores y herramienta de corte para torno y maquinado. Marcas de calidad en Puebla. Solicita tu cotización.",
    ],
    [
      "perforacion-accesorios-taladro",
      "Brocas Industriales y Perforación en Puebla | Tehesa",
      "Brocas Bohrcraft, juegos y accesorios de perforación para industria. Distribuidor directo en Puebla. Cotiza por WhatsApp.",
    ],
  ])(
    "marks %s index, follow with a matching canonical",
    async (slug, title, description) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      })

      expect(metadata.title).toBe(title)
      expect(metadata.description).toBe(description)
      expect(metadata.alternates).toEqual({
        canonical: `/categorias/${slug}`,
      })
      expect(metadata.robots).toEqual({ index: true, follow: true })
    },
  )

  it("calls notFound for an unknown slug", async () => {
    const { notFound } = jest.requireMock("next/navigation") as {
      notFound: jest.Mock
    }

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "nope" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND")
    expect(notFound).toHaveBeenCalled()
  })
})
