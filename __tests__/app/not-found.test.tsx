import { render, screen } from "@__tests__/test-utils"
import NotFound from "@/app/not-found"

describe("app-level not-found", () => {
  it("renders the heading and a link back to categorías", () => {
    render(<NotFound />)

    expect(
      screen.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Ver todas las categorías" }),
    ).toHaveAttribute("href", "/categorias")
  })
})
