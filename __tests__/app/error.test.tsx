/**
 * @jest-environment jsdom
 */
import { render, screen, userEvent } from "@__tests__/test-utils"
import Error from "@/app/error"

describe("app error boundary", () => {
  it("shows Spanish recovery copy and retries through reset", async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<Error reset={reset} />)

    expect(
      screen.getByRole("heading", { name: "No pudimos cargar el catálogo." }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
