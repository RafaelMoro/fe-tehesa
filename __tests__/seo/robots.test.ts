/**
 * @jest-environment node
 */
import robots from "@/app/robots"

describe("robots", () => {
  it("disallows /api/, keeps ?mode=name crawlable, and points to an absolute sitemap URL", () => {
    const result = robots()

    expect(result.rules).toEqual({
      userAgent: "*",
      disallow: "/api/",
    })
    expect(result.sitemap).toMatch(/^https?:\/\/.+\/sitemap\.xml$/)
    expect(JSON.stringify(result)).not.toContain("mode=name")
  })
})
