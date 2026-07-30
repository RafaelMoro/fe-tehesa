/**
 * @jest-environment node
 */
import sitemap from "@/app/sitemap"
import {
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
} from "@/shared/constants/catalog.constants"
import type { TaxonomyItem } from "@/shared/types/global.types"

const fetchCategoriesMock = jest.fn()
const fetchBrandsMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
  fetchBrands: (...args: unknown[]) => fetchBrandsMock(...args),
}))

afterEach(() => {
  fetchCategoriesMock.mockReset()
  fetchBrandsMock.mockReset()
})

const categories: TaxonomyItem[] = [{ name: "Brocas", customId: "brocas" }]
const brands: TaxonomyItem[] = [
  { name: "Bohrcraft", customId: "bohrcraft" },
  { name: "King Tony", customId: "king-tony" },
]

describe("sitemap", () => {
  it("lists the base pages plus one URL per category and brand, no lastModified, no name-mode entries", async () => {
    fetchCategoriesMock.mockResolvedValue(categories)
    fetchBrandsMock.mockResolvedValue(brands)

    const result = await sitemap()

    const basePageCount = PRODUCT_PAGE_MAX - PRODUCT_PAGE_MIN + 1
    expect(result).toHaveLength(
      basePageCount + categories.length + brands.length,
    )
    expect(result.some((entry) => entry.url.endsWith("/"))).toBe(true)
    expect(
      result.some((entry) => entry.url.includes("mode=category")),
    ).toBe(true)
    expect(result.some((entry) => entry.url.includes("mode=brand"))).toBe(
      true,
    )
    expect(result.some((entry) => entry.url.includes("mode=name"))).toBe(
      false,
    )
    result.forEach((entry) => {
      expect(entry).not.toHaveProperty("lastModified")
    })
  })

  it("degrades to base pages only when the taxonomy fetch rejects", async () => {
    fetchCategoriesMock.mockRejectedValue(new Error("upstream down"))
    fetchBrandsMock.mockResolvedValue(brands)

    const result = await sitemap()

    const basePageCount = PRODUCT_PAGE_MAX - PRODUCT_PAGE_MIN + 1
    expect(result).toHaveLength(basePageCount)
    expect(result.some((entry) => entry.url.includes("mode="))).toBe(false)
  })
})
