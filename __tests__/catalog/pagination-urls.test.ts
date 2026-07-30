/**
 * @jest-environment node
 */
import {
  buildBasePagePath,
  buildCanonicalPath,
  buildModeUrl,
  parseCatalogParams,
} from "@/features/Pagination/utils.pagination"
import {
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
} from "@/shared/constants/catalog.constants"

describe("parseCatalogParams", () => {
  it("defaults base mode to page 1 when page is missing", () => {
    expect(parseCatalogParams({})).toEqual({
      mode: "base",
      value: null,
      page: PRODUCT_PAGE_MIN,
    })
  })

  it("parses a valid base page", () => {
    expect(parseCatalogParams({ page: "3" })).toEqual({
      mode: "base",
      value: null,
      page: 3,
    })
  })

  it("returns null for a malformed base page", () => {
    expect(parseCatalogParams({ page: "abc" })).toBeNull()
  })

  it("returns null for a base page above PRODUCT_PAGE_MAX", () => {
    expect(
      parseCatalogParams({ page: String(PRODUCT_PAGE_MAX + 1) }),
    ).toBeNull()
  })

  it("returns null for a base page below PRODUCT_PAGE_MIN", () => {
    expect(parseCatalogParams({ page: "0" })).toBeNull()
  })

  it("parses a valid name mode", () => {
    expect(parseCatalogParams({ mode: "name", q: "broca", page: "2" })).toEqual({
      mode: "name",
      value: "broca",
      page: 2,
    })
  })

  it("returns null for name mode missing q", () => {
    expect(parseCatalogParams({ mode: "name", page: "1" })).toBeNull()
  })

  it("returns null for category mode missing category", () => {
    expect(parseCatalogParams({ mode: "category", page: "1" })).toBeNull()
  })

  it("parses a valid brand mode", () => {
    expect(
      parseCatalogParams({ mode: "brand", brand: "Acme", page: "1" }),
    ).toEqual({
      mode: "brand",
      value: "Acme",
      page: 1,
    })
  })

  it("returns null for a malformed wide-mode page", () => {
    expect(
      parseCatalogParams({ mode: "category", category: "Brocas", page: "x" }),
    ).toBeNull()
  })

  it("has no upper bound on wide-mode pages", () => {
    expect(
      parseCatalogParams({ mode: "brand", brand: "Acme", page: "999" }),
    ).toEqual({
      mode: "brand",
      value: "Acme",
      page: 999,
    })
  })

  it("returns null for an unknown mode", () => {
    expect(parseCatalogParams({ mode: "unknown" })).toBeNull()
  })
})

describe("buildBasePagePath", () => {
  it("collapses page 1 to /", () => {
    expect(buildBasePagePath(1)).toBe("/")
  })

  it("builds /?page=N for page > 1", () => {
    expect(buildBasePagePath(3)).toBe("/?page=3")
  })
})

describe("buildModeUrl", () => {
  it("encodes the mode value", () => {
    expect(buildModeUrl("category", "Tubos PVC", 1)).toBe(
      "/?mode=category&category=Tubos+PVC&page=1",
    )
  })

  it("uses q as the key for name mode", () => {
    expect(buildModeUrl("name", "broca", 2)).toBe(
      "/?mode=name&q=broca&page=2",
    )
  })

  it("only sets notice when explicitly requested", () => {
    expect(buildModeUrl("brand", "Acme", 1)).not.toContain("notice")
    expect(buildModeUrl("brand", "Acme", 1, "end")).toContain("notice=end")
  })
})

describe("buildCanonicalPath", () => {
  it("collapses base page 1 to /", () => {
    expect(buildCanonicalPath({ mode: "base", value: null, page: 1 })).toBe(
      "/",
    )
  })

  it("builds /?page=N for base pages beyond 1", () => {
    expect(buildCanonicalPath({ mode: "base", value: null, page: 3 })).toBe(
      "/?page=3",
    )
  })

  it("builds a mode URL for category/brand/name without notice", () => {
    const canonical = buildCanonicalPath({
      mode: "category",
      value: "Brocas",
      page: 2,
    })
    expect(canonical).toBe("/?mode=category&category=Brocas&page=2")
    expect(canonical).not.toContain("notice")
  })
})
