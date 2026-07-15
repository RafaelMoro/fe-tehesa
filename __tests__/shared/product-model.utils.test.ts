import { getProductModelKind } from "@/shared/utils/product-model.utils"

describe("getProductModelKind", () => {
  it.each([
    ["Machuelo máquina HSS-E", "Herramientas de corte", "tap"],
    ["Cortador vertical de carburo", "Carburo", "endmill"],
    ["Juego de brocas de cobalto", "Perforación", "drill-set"],
    ["Broca zanco recto", "Perforación", "drill"],
    ["Banda industrial A-42", "Transmisión de potencia", "belt"],
    ["Tuerca hexagonal", "Tornillería", "nut"],
    ["Rondana de presión negra", "Tornillería", "washer"],
    ["Dado tarraja ajustable", "Roscado", "die"],
    ["Tornillo ojo forjado", "Tornillería", "bolt"],
    ["Dado cuadro 1/2 pulgada", "Llaves", "socket"],
    ["Abrazadera reforzada", "Sujeción", "clamp"],
  ])("maps %s (%s) to %s", (name, category, expected) => {
    expect(getProductModelKind({ name, category: { name: category } })).toBe(
      expected,
    )
  })

  it("uses category fallback for less specific product names", () => {
    expect(
      getProductModelKind({
        name: "Serie industrial 400",
        category: { name: "Perforación y accesorios para taladro" },
      }),
    ).toBe("drill")
  })
})
