/**
 * @jest-environment jsdom
 */
import { render, screen, userEvent } from "@__tests__/test-utils"
import Error from "@/app/marcas/[slug]/error"

let mockSlug = "weston"

jest.mock("next/navigation", () => ({
  useParams: () => ({ slug: mockSlug }),
}))

describe("marcas/[slug] error boundary", () => {
  it.each([
    ["weston", "Weston"],
    ["king-tony", "King Tony"],
    ["bohrcraft", "Bohrcraft"],
    ["bondhus", "Bondhus"],
    ["precision", "Precision Brand"],
    ["cleveland", "Cleveland"],
  ])("shows Spanish error copy for %s", (slug, displayName) => {
    mockSlug = slug

    render(<Error reset={jest.fn()} />)

    expect(
      screen.getByRole("heading", {
        name: `No pudimos cargar los productos de ${displayName}`,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ver todas las marcas" }),
    ).toBeInTheDocument()
  })

  it("retries through reset", async () => {
    mockSlug = "weston"
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
        name: "No pudimos cargar los productos de esta marca",
      }),
    ).toBeInTheDocument()
  })

  it("shows role alert", () => {
    mockSlug = "weston"
    render(<Error reset={jest.fn()} />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})
