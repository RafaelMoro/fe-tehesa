import { formatNumberToCurrency } from "@/shared/utils/global.utils"

describe("formatNumberToCurrency", () => {
  it("formats a positive amount as MXN currency", () => {
    expect(formatNumberToCurrency(1234.5)).toBe("$1,234.50 MXN")
  })
})
