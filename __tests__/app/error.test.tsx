/**
 * @jest-environment jsdom
 */
import { render, screen } from "@__tests__/test-utils"
import Error from "@/app/error"

describe("app error boundary", () => {
  it("shows Spanish error copy with a disabled retry action", () => {
    const reset = jest.fn()

    render(<Error reset={reset} />)

    expect(screen.getByText("No pudimos cargar los productos.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeDisabled()
  })
})
