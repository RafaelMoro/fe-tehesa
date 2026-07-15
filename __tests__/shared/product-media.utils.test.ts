import { getProductMediaAsset } from "@/shared/utils/product-media.utils"

describe("getProductMediaAsset", () => {
  it("maps the four-flute carbide cutter image", () => {
    expect(
      getProductMediaAsset({
        name: "Cortador vertical de carburo 4 filos",
      }),
    ).toEqual(
      expect.objectContaining({
        src: "/products/cortador-carburo-4-filos.png",
      }),
    )
  })

  it("maps the HSS-E blind-hole tap image", () => {
    expect(
      getProductMediaAsset({
        name: "Machuelo máquina HSS-E para agujero ciego",
      }),
    ).toEqual(
      expect.objectContaining({
        src: "/products/machuelo-hsse-agujero-ciego.png",
      }),
    )
  })

  it("does not reuse a specific photo for unrelated products", () => {
    expect(getProductMediaAsset({ name: "Broca para concreto" })).toBeNull()
  })
})
