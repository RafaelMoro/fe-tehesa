/**
 * @jest-environment node
 */
import { generateMetadata } from "@/app/cotizar/page"
import { QUOTE_DESCRIPTION, QUOTE_TITLE } from "@/shared/constants/seo.constants"

describe("cotizar generateMetadata", () => {
  it("marks the route noindex, follow with a /cotizar canonical", () => {
    const metadata = generateMetadata()

    expect(metadata.title).toBe(QUOTE_TITLE)
    expect(metadata.description).toBe(QUOTE_DESCRIPTION)
    expect(metadata.alternates).toEqual({ canonical: "/cotizar" })
    expect(metadata.robots).toEqual({ index: false, follow: true })
  })
})
