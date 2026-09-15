/**
 * @jest-environment jsdom
 */
import { render, screen, userEvent } from "@__tests__/test-utils"
import Error from "@/app/categorias/abrasivos/error"

describe("categorias/abrasivos error boundary", () => {
  it("shows Spanish error copy and retries through reset", async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<Error reset={reset} />)

    expect(
      screen.getByRole("heading", {
        name: "No pudimos cargar los productos de Abrasivos",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
