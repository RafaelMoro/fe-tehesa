/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/marcas/[slug]/page"

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

describe("marcas/[slug] generateMetadata", () => {
  it.each([
    [
      "weston",
      "Weston en Puebla — Herramienta Industrial Mexicana | Tehesa",
      "Distribuidor de Weston en Puebla: cortadores, brocas, machuelos y rimas para la industria. Marca mexicana con +30 años. Cotiza con Tehesa.",
    ],
    [
      "volkel",
      "Völkel en Puebla — Machuelos y Herramienta de Roscado | Tehesa",
      "Distribuidor de Völkel en Puebla: machuelos, tarrajas y herramienta de roscado de fabricante alemán especializado. Cotiza con Tehesa Industrial.",
    ],
    [
      "king-tony",
      "King Tony en Puebla — Dados y Llaves Profesionales | Tehesa",
      "Distribuidor de King Tony en Puebla. Dados, matracas y llaves de apriete bajo norma DIN y ANSI. Cotiza con Tehesa Industrial.",
    ],
    [
      "bohrcraft",
      "Bohrcraft en Puebla — Brocas y Machuelos Alemanes | Tehesa",
      "Distribuidor directo de Bohrcraft en Puebla. Brocas y machuelos de precisión alemana para industria. Cotiza con Tehesa.",
    ],
    [
      "bondhus",
      "Bondhus en Puebla — Llaves Hexagonales Made in USA | Tehesa",
      "Distribuidor de Bondhus en Puebla. Llaves hexagonales y Torx hechas en EUA, inventoras de la punta de bola. Cotiza con Tehesa.",
    ],
    [
      "precision",
      "Precision Brand en Puebla — Laina de Precisión | Tehesa",
      "Distribuidor de Precision Brand en Puebla. Laina en rollo para alineación de maquinaria y ajuste de troqueles. Cotiza con Tehesa.",
    ],
    [
      "cleveland",
      "Cleveland en Puebla — Buriles y Machuelos de Cobalto | Tehesa",
      "Distribuidor de Cleveland en Puebla. Buriles de cobalto K-42 y machuelos para maquinado industrial. Cotiza con Tehesa Industrial.",
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
        canonical: `/marcas/${slug}`,
      })
      expect(metadata.robots).toEqual({ index: true, follow: true })
    },
  )

  it.each(["libre", "Clevaland", "nope"])(
    "calls notFound for %s",
    async (slug) => {
      const { notFound } = jest.requireMock("next/navigation") as {
        notFound: jest.Mock
      }

      await expect(
        generateMetadata({ params: Promise.resolve({ slug }) }),
      ).rejects.toThrow("NEXT_NOT_FOUND")
      expect(notFound).toHaveBeenCalled()
    },
  )
})
