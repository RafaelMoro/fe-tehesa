import { createCartStore, type CartLine } from "@/zustand/store/cart.store"

const line: CartLine = {
  id: "product-1:sku-1:shipping",
  productId: "product-1",
  name: "Machuelo A.A.V.",
  brand: "VÖLKEL",
  sku: "SKU-1",
  variant: "1/2 pulg. · Estándar · A.A.V.",
  fulfillment: "shipping",
  listPrice: 100,
  unitPrice: 100,
  quantity: 9,
}

describe("cart store", () => {
  it("merges equal configurations and recalculates the volume price", () => {
    const store = createCartStore()

    store.getState().addItem(line)
    store.getState().addItem({ ...line, quantity: 1 })

    expect(store.getState().lines).toEqual([
      expect.objectContaining({
        id: line.id,
        quantity: 10,
        unitPrice: 96,
      }),
    ])
  })

  it("keeps fulfillment configurations as separate lines", () => {
    const store = createCartStore()

    store.getState().addItem(line)
    store.getState().addItem({
      ...line,
      id: "product-1:sku-1:pickup",
      fulfillment: "pickup",
      quantity: 1,
    })

    expect(store.getState().lines).toHaveLength(2)
  })
})
