/**
 * @jest-environment node
 */
import {
  buildCatalogJsonLd,
  buildCatalogMetadata,
  toJsonLdHtml,
} from "@/shared/utils/seo.utils"
import { SITE_DESCRIPTION, SITE_TITLE } from "@/shared/constants/seo.constants"
import type { Product } from "@/shared/types/global.types"

type OfferJsonLd = {
  "@type": "Offer"
  price: number
  priceCurrency: string
}

type AggregateOfferJsonLd = {
  "@type": "AggregateOffer"
  lowPrice: number
  highPrice: number
  priceCurrency: string
  offerCount?: number
}

type ProductJsonLd = {
  "@type": "Product"
  name: string
  brand?: { "@type": "Brand"; name: string }
  category?: string
  offers?: OfferJsonLd | AggregateOfferJsonLd
}

type ItemListJsonLd = {
  "@type": "ItemList"
  itemListElement: Array<{
    "@type": "ListItem"
    position: number
    item: ProductJsonLd
  }>
}

type WebSiteJsonLd = { "@type": "WebSite" }
type BreadcrumbListJsonLd = { "@type": "BreadcrumbList" }

type GraphNode = WebSiteJsonLd | ItemListJsonLd | BreadcrumbListJsonLd

type JsonLdDocument = {
  "@context": string
  "@graph": GraphNode[]
}

const asJsonLdDocument = (payload: object) => payload as JsonLdDocument

const isItemList = (node: GraphNode): node is ItemListJsonLd =>
  node["@type"] === "ItemList"

const baseProduct: Product = {
  name: "Broca 1/2",
  documentId: "doc-1",
  category: { name: "Brocas" },
  brand: { name: "Bohrcraft" },
}

describe("buildCatalogMetadata", () => {
  it("base mode page 1: site title, root description, canonical /, indexable", () => {
    const metadata = buildCatalogMetadata({})
    expect(metadata.title).toBe(SITE_TITLE)
    expect(metadata.description).toBe(SITE_DESCRIPTION)
    expect(metadata.alternates?.canonical).toBe("/")
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
  })

  it("base mode page N: page-suffixed title, canonical, indexable", () => {
    const metadata = buildCatalogMetadata({ page: "3" })
    expect(metadata.title).toBe(
      "Herramienta Industrial y Tornilleria en Puebla | Pagina 3 | Tehesa",
    )
    expect(metadata.alternates?.canonical).toBe("/?page=3")
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
  })

  it("category mode page 1: value-led title, self canonical, indexable", () => {
    const metadata = buildCatalogMetadata({
      mode: "category",
      category: "Brocas",
      page: "1",
    })
    expect(metadata.title).toBe(
      "Brocas | Herramienta industrial en Puebla | Tehesa",
    )
    expect(metadata.alternates?.canonical).toBe(
      "/?mode=category&category=Brocas&page=1",
    )
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
  })

  it("category mode page N: adds the page suffix before Tehesa", () => {
    const metadata = buildCatalogMetadata({
      mode: "category",
      category: "Brocas",
      page: "2",
    })
    expect(metadata.title).toBe(
      "Brocas | Herramienta industrial en Puebla | Pagina 2 | Tehesa",
    )
  })

  it("brand mode: value-led title, self canonical, indexable", () => {
    const metadata = buildCatalogMetadata({
      mode: "brand",
      brand: "Bohrcraft",
      page: "1",
    })
    expect(metadata.title).toBe(
      "Bohrcraft | Herramienta industrial en Puebla | Tehesa",
    )
    expect(metadata.alternates?.canonical).toBe(
      "/?mode=brand&brand=Bohrcraft&page=1",
    )
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
  })

  it("name mode: quoted-term title, self canonical, noindex/follow", () => {
    const metadata = buildCatalogMetadata({
      mode: "name",
      q: "broca",
      page: "1",
    })
    expect(metadata.title).toBe('Resultados para "broca" | Tehesa')
    expect(metadata.alternates?.canonical).toBe("/?mode=name&q=broca&page=1")
    expect(metadata.robots).toMatchObject({ index: false, follow: true })
  })

  it("name mode page N: page suffix before Tehesa", () => {
    const metadata = buildCatalogMetadata({
      mode: "name",
      q: "broca",
      page: "2",
    })
    expect(metadata.title).toBe('Resultados para "broca" | Pagina 2 | Tehesa')
  })

  it("invalid params: root title/description, noindex/follow", () => {
    const metadata = buildCatalogMetadata({ mode: "name" })
    expect(metadata.title).toBe(SITE_TITLE)
    expect(metadata.description).toBe(SITE_DESCRIPTION)
    expect(metadata.robots).toMatchObject({ index: false, follow: true })
  })
})

describe("buildCatalogJsonLd", () => {
  it("emits WebSite + SearchAction on base mode only", () => {
    const baseDoc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "base", value: null, page: 1 }, []),
    )
    expect(baseDoc["@graph"].some((node) => node["@type"] === "WebSite")).toBe(
      true,
    )

    const categoryDoc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "category", value: "Brocas", page: 1 }, []),
    )
    expect(
      categoryDoc["@graph"].some((node) => node["@type"] === "WebSite"),
    ).toBe(false)
  })

  it("omits ItemList entirely when there are no products", () => {
    const doc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "base", value: null, page: 1 }, []),
    )
    expect(doc["@graph"].some((node) => node["@type"] === "ItemList")).toBe(
      false,
    )
  })

  it("omits offers when minPrice/maxPrice are missing", () => {
    const doc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "base", value: null, page: 1 }, [
        baseProduct,
      ]),
    )
    const itemList = doc["@graph"].find(isItemList)
    const serializedItem = JSON.parse(
      JSON.stringify(itemList?.itemListElement[0].item),
    )
    expect(serializedItem).not.toHaveProperty("offers")
  })

  it("uses a single Offer when hasOneProductVariant is true", () => {
    const doc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "base", value: null, page: 1 }, [
        {
          ...baseProduct,
          minPrice: 100,
          maxPrice: 100,
          hasOneProductVariant: true,
        },
      ]),
    )
    const itemList = doc["@graph"].find(isItemList)
    expect(itemList?.itemListElement[0].item.offers).toEqual({
      "@type": "Offer",
      price: 100,
      priceCurrency: "MXN",
    })
  })

  it("uses an AggregateOffer with MXN when there are multiple variants", () => {
    const doc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "base", value: null, page: 1 }, [
        {
          ...baseProduct,
          minPrice: 50,
          maxPrice: 150,
          variantCount: 3,
          hasOneProductVariant: false,
        },
      ]),
    )
    const itemList = doc["@graph"].find(isItemList)
    expect(itemList?.itemListElement[0].item.offers).toEqual({
      "@type": "AggregateOffer",
      lowPrice: 50,
      highPrice: 150,
      priceCurrency: "MXN",
      offerCount: 3,
    })
  })

  it("emits BreadcrumbList only on category/brand modes", () => {
    const categoryDoc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "category", value: "Brocas", page: 1 }, []),
    )
    expect(
      categoryDoc["@graph"].some((node) => node["@type"] === "BreadcrumbList"),
    ).toBe(true)

    const baseDoc = asJsonLdDocument(
      buildCatalogJsonLd({ mode: "base", value: null, page: 1 }, []),
    )
    expect(
      baseDoc["@graph"].some((node) => node["@type"] === "BreadcrumbList"),
    ).toBe(false)
  })
})

describe("toJsonLdHtml", () => {
  it("escapes < so a product name cannot close the surrounding <script>", () => {
    const html = toJsonLdHtml({ name: "Broca </script><script>alert(1)" })
    expect(html).not.toContain("</script>")
    expect(html).not.toContain("<")
    expect(html).toContain("\\u003c/script>\\u003cscript>alert(1)")
  })
})
