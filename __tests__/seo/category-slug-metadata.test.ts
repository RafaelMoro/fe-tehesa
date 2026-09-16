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
    [
      "llaves-herramientas-apriete",
      "Llaves, Dados y Herramientas de Apriete | Tehesa Industrial",
      "Dados, llaves, puntas y bristol King Tony para industria y taller. Existencia en Puebla. Solicita cotización con Tehesa Industrial.",
    ],
    [
      "roscado-herramientas-roscas",
      "Machuelos, Terrajas y Herramientas de Roscado | Tehesa Puebla",
      "Machuelos, terrajas y juegos de roscado Bohrcraft para industria y taller. Distribuidor directo en Puebla. Cotiza por WhatsApp.",
    ],
    [
      "carburo",
      "Limas Diamantadas y Herramientas de Carburo | Tehesa Puebla",
      "Limas diamantadas, puntas de diamante, limas rotativas y cortadores de carburo. Precisión industrial en Puebla. Cotiza hoy.",
    ],
    [
      "sujecion",
      "Clamps y Herramientas de Sujeción Industrial | Tehesa Puebla",
      "Clamps verticales, horizontales y de jalar para sujeción industrial. Existencia en Puebla. Cotiza con Tehesa Industrial.",
    ],
    [
      "calibrador",
      "Calibradores Industriales en Puebla | Tehesa Industrial",
      "Calibradores y cuenta hilos para medición industrial de precisión. Existencia en Puebla. Solicita tu cotización.",
    ],
    [
      "extraccion-reparacion-fijaciones",
      "Extractores de Tornillos y Reparación de Fijaciones | Tehesa",
      "Extractores de tornillos y manerales para reparación de fijaciones. Distribuidor industrial en Puebla. Solicita tu cotización.",
    ],
    [
      "adhesivos-selladores",
      "Adhesivos y Selladores Industriales en Puebla | Tehesa",
      "Adhesivos y selladores para fijación y sellado industrial. Abasto en Puebla. Cotiza con Tehesa Industrial.",
    ],
    [
      "equipo-seguridad",
      "Equipo de Seguridad Industrial en Puebla | Tehesa Industrial",
      "Lentes y equipo de seguridad para entornos industriales. Existencia en Puebla. Cotiza con Tehesa Industrial.",
    ],
    [
      "herramientas-diagnostico-electricidad",
      "Probadores y Herramientas de Diagnóstico Eléctrico | Tehesa Puebla",
      "Probadores eléctricos y herramienta de diagnóstico para electricidad y electrónica industrial. Puebla. Solicita tu cotización.",
    ],
    [
      "herrajes-accesorios-cable",
      "Herrajes y Accesorios para Cable en Puebla | Tehesa Industrial",
      "Herrajes y accesorios para cable de acero en aplicaciones industriales. Existencia en Puebla. Cotiza hoy.",
    ],
    [
      "lubricantes-multifuncionales",
      "Lubricantes Multifuncionales Industriales | Tehesa Puebla",
      "Lubricantes multifuncionales para mantenimiento industrial y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.",
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
