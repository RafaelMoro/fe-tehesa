/**
 * @jest-environment node
 */
import {
  fetchBrands,
  fetchCategories,
  fetchProductVariants,
  fetchProducts,
  fetchProductsByBrand,
  fetchProductsByCategory,
  fetchProductsByName,
} from "@/shared/lib/global.lib"
import {
  GET_BRANDS,
  GET_CATEGORIES,
  GET_PRODUCT_VARIANTS,
  GET_PRODUCTS,
  GET_PRODUCTS_BY_BRAND,
  GET_PRODUCTS_BY_CATEGORY,
  GET_PRODUCTS_BY_NAME,
} from "@/shared/queries/global.queries"
import type {
  FetchBrandsResponse,
  FetchCategoriesResponse,
  FetchProductsResponse,
  FetchSingleProductResponse,
  Product,
  ProductVariant,
  TaxonomyItem,
} from "@/shared/types/global.types"

const queryMock = jest.fn()

jest.mock("@/app/apollo-client", () => ({
  __esModule: true,
  default: () => ({
    query: (...args: unknown[]) => queryMock(...args),
  }),
}))

const ok = <T>(data: T) => ({ data })

afterEach(() => {
  queryMock.mockReset()
})

const product: Product = {
  name: "Tire",
  category: { name: "Tubes" },
  brand: { name: "Acme" },
  documentId: "doc-1",
}

const variant: ProductVariant = { diameter: '15"', pricing: { price: 100 } }

describe("Apollo adapters", () => {
  it("fetchProducts sends GET_PRODUCTS with page and page size 50", async () => {
    queryMock.mockResolvedValue(ok<FetchProductsResponse>({ products: [product] }))

    const result = await fetchProducts(3)
    expect(result).toEqual([product])
    expect(queryMock).toHaveBeenCalledWith({
      query: GET_PRODUCTS,
      variables: { pagination: { page: 3, pageSize: 50 } },
    })
  })

  it("fetchProductsByCategory sends category name.contains and page size 50", async () => {
    queryMock.mockResolvedValue(ok<FetchProductsResponse>({ products: [product] }))

    const result = await fetchProductsByCategory("Tubos", 2)
    expect(result).toEqual([product])
    expect(queryMock).toHaveBeenCalledWith({
      query: GET_PRODUCTS_BY_CATEGORY,
      variables: {
        filters: { category: { name: { contains: "Tubos" } } },
        pagination: { page: 2, pageSize: 50 },
      },
    })
  })

  it("fetchProductsByBrand sends brand name.contains and page size 50", async () => {
    queryMock.mockResolvedValue(ok<FetchProductsResponse>({ products: [product] }))

    const result = await fetchProductsByBrand("Acme", 4)
    expect(result).toEqual([product])
    expect(queryMock).toHaveBeenCalledWith({
      query: GET_PRODUCTS_BY_BRAND,
      variables: {
        filters: { brand: { name: { contains: "Acme" } } },
        pagination: { page: 4, pageSize: 50 },
      },
    })
  })

  it("fetchProductsByName sends name contains and page size 50", async () => {
    queryMock.mockResolvedValue(ok<FetchProductsResponse>({ products: [product] }))

    const result = await fetchProductsByName("tire", 1)
    expect(result).toEqual([product])
    expect(queryMock).toHaveBeenCalledWith({
      query: GET_PRODUCTS_BY_NAME,
      variables: {
        filters: { name: { contains: "tire" } },
        pagination: { page: 1, pageSize: 50 },
      },
    })
  })

  it("fetchProductVariants sends documentId with page 1 and size 100", async () => {
    queryMock.mockResolvedValue(
      ok<FetchSingleProductResponse>({
        product: { product_variants: [variant] } as Product,
      }),
    )

    const result = await fetchProductVariants({ documentId: "doc-1" })
    expect(result).toEqual([variant])
    expect(queryMock).toHaveBeenCalledWith({
      query: GET_PRODUCT_VARIANTS,
      variables: {
        documentId: "doc-1",
        pagination: { page: 1, pageSize: 100 },
      },
    })
  })

  it("fetchCategories sends GET_CATEGORIES without variables", async () => {
    const categories: TaxonomyItem[] = [{ name: "Tubes", customId: "tubes" }]
    queryMock.mockResolvedValue(ok<FetchCategoriesResponse>({ categories }))

    const result = await fetchCategories()
    expect(result).toEqual(categories)
    expect(queryMock).toHaveBeenCalledWith({ query: GET_CATEGORIES })
  })

  it("fetchBrands sends GET_BRANDS without variables", async () => {
    const brands: TaxonomyItem[] = [{ name: "Acme", customId: "acme" }]
    queryMock.mockResolvedValue(ok<FetchBrandsResponse>({ brands }))

    const result = await fetchBrands()
    expect(result).toEqual(brands)
    expect(queryMock).toHaveBeenCalledWith({ query: GET_BRANDS })
  })

  describe("null-data fallbacks", () => {
    it("fetchProducts returns [] when products is missing", async () => {
      queryMock.mockResolvedValue({ data: {} })
      const result = await fetchProducts(1)
      expect(result).toEqual([])
    })

    it("fetchProductVariants returns [] when product is missing", async () => {
      queryMock.mockResolvedValue({ data: {} })
      const result = await fetchProductVariants({ documentId: "doc-1" })
      expect(result).toEqual([])
    })

    it("fetchProductVariants returns [] when product_variants is missing", async () => {
      queryMock.mockResolvedValue({
        data: { product: { product_variants: undefined } as Product },
      })
      const result = await fetchProductVariants({ documentId: "doc-1" })
      expect(result).toEqual([])
    })

    it("fetchCategories returns [] when categories is missing", async () => {
      queryMock.mockResolvedValue({ data: {} })
      const result = await fetchCategories()
      expect(result).toEqual([])
    })

    it("fetchBrands returns [] when brands is missing", async () => {
      queryMock.mockResolvedValue({ data: {} })
      const result = await fetchBrands()
      expect(result).toEqual([])
    })
  })

  describe("category and brand rejection propagation", () => {
    it("fetchProductsByCategory rejects on Apollo failure", async () => {
      queryMock.mockRejectedValue(new Error("up"))
      await expect(fetchProductsByCategory("tubes", 1)).rejects.toThrow("up")
    })

    it("fetchProductsByBrand rejects on Apollo failure", async () => {
      queryMock.mockRejectedValue(new Error("up"))
      await expect(fetchProductsByBrand("acme", 1)).rejects.toThrow("up")
    })
  })
})
