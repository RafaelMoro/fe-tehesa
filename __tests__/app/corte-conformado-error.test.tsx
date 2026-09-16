/**
 * @jest-environment jsdom
 */
import { render, screen, userEvent } from "@__tests__/test-utils"
import Error from "@/app/categorias/herramientas-corte-conformado/error"

describe("categorias/herramientas-corte-conformado error boundary", () => {
  it("shows Spanish error copy and retries through reset", async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<Error reset={reset} />)

    expect(
      screen.getByRole("heading", {
        name: "No pudimos cargar los productos de Herramientas de corte y conformado",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
