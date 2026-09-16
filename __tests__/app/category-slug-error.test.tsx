/**
 * @jest-environment jsdom
 */
import { render, screen, userEvent } from "@__tests__/test-utils"
import Error from "@/app/categorias/[slug]/error"

let mockSlug = "tornilleria-fijacion"

jest.mock("next/navigation", () => ({
  useParams: () => ({ slug: mockSlug }),
}))

describe("categorias/[slug] error boundary", () => {
  it.each([
    ["tornilleria-fijacion", "Tornillería"],
    ["abrasivos", "Abrasivos"],
    ["impacto-forja", "Herramientas de impacto o forja"],
    ["herramientas-corte-conformado", "Herramientas de corte y conformado"],
    [
      "perforacion-accesorios-taladro",
      "Perforación y accesorios para taladro",
    ],
    ["llaves-herramientas-apriete", "Llaves y herramientas de apriete"],
    ["roscado-herramientas-roscas", "Roscado y herramientas para roscas"],
    ["carburo", "Carburo"],
    ["sujecion", "Sujeción"],
    ["calibrador", "Calibrador"],
    [
      "extraccion-reparacion-fijaciones",
      "Extracción y Reparación de fijaciones",
    ],
    ["adhesivos-selladores", "Adhesivos y selladores"],
    ["equipo-seguridad", "Equipo de seguridad"],
    [
      "herramientas-diagnostico-electricidad",
      "Herramientas de diagnóstico de electricidad y electrónica",
    ],
    ["herrajes-accesorios-cable", "Herrajes y accesorios para cable"],
    ["lubricantes-multifuncionales", "Lubricantes multifuncionales"],
  ])("shows Spanish error copy for %s", (slug, strapiName) => {
    mockSlug = slug

    render(<Error reset={jest.fn()} />)

    expect(
      screen.getByRole("heading", {
        name: `No pudimos cargar los productos de ${strapiName}`,
      }),
    ).toBeInTheDocument()
  })

  it("retries through reset", async () => {
    mockSlug = "tornilleria-fijacion"
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<Error reset={reset} />)
    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }))

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it("falls back to generic copy for an unknown slug", () => {
    mockSlug = "nope"

    render(<Error reset={jest.fn()} />)

    expect(
      screen.getByRole("heading", {
        name: "No pudimos cargar los productos de esta categoría",
      }),
    ).toBeInTheDocument()
  })
})
