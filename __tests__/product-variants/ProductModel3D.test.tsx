import { render, screen, userEvent } from "@__tests__/test-utils"
import { ProductModel3D } from "@/features/ProductVariantsDrawer/ProductModel3D"
import type { Product } from "@/shared/types/global.types"

const cutter: Product = {
  name: "Cortador vertical de carburo 4 filos",
  documentId: "demo-weston-cortador",
  category: { name: "Carburo" },
  brand: { name: "Weston" },
}

describe("ProductModel3D", () => {
  it("starts with the product photo and allows switching to 3D", async () => {
    const user = userEvent.setup()
    render(<ProductModel3D product={cutter} sku="WE-CV4-6" />)

    expect(
      screen.getByRole("img", {
        name: "Cortador vertical de carburo plano con cuatro filos",
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Foto" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )

    await user.click(screen.getByRole("button", { name: "3D" }))

    expect(
      screen.getByRole("img", {
        name: /Modelo 3D interactivo de cortador/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })
})
