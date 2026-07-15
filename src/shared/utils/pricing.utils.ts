export const VOLUME_TIERS = [
  { minimum: 1, maximum: 9, label: "1-9", discount: 0 },
  { minimum: 10, maximum: 24, label: "10-24", discount: 0.04 },
  { minimum: 25, maximum: 49, label: "25-49", discount: 0.08 },
  { minimum: 50, maximum: Infinity, label: "50+", discount: 0.12 },
] as const

export const roundCurrency = (amount: number) => Math.round(amount * 100) / 100

export const getQuantityDiscount = (quantity: number) =>
  VOLUME_TIERS.find(
    (tier) => quantity >= tier.minimum && quantity <= tier.maximum,
  )?.discount ?? 0

export const getDiscountedUnitPrice = (listPrice: number, quantity: number) =>
  roundCurrency(listPrice * (1 - getQuantityDiscount(quantity)))
