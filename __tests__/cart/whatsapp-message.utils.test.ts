import {
  buildQuoteMessages,
  buildWhatsappUrl,
  generateQuoteReference,
  sanitizeForWhatsapp,
} from "@/shared/utils/whatsapp-message.utils"
import { WHATSAPP_URL_MAX_ENCODED_LENGTH } from "@/shared/constants/whatsapp.constants"
import type {
  CartContact,
  CartProductLine,
  CartVariantLine,
} from "@/shared/types/global.types"

const contact: CartContact = {
  firstName: "Rafael",
  lastName: "Moro",
  email: "rafael@example.com",
}

const pricedLine: CartVariantLine = {
  productDocumentId: "prod-1",
  productName: "Broca Larga Acero A.V.",
  quantity: 3,
  variantDocumentId: "variant-1",
  internalId: "BRO-1234",
  diameter: '1/4"',
  unitPrice: 120,
}

const noVariantLine: CartProductLine = {
  productDocumentId: "prod-2",
  productName: "Llave Hexagonal Bondhus",
  quantity: 2,
  variantDocumentId: null,
  unitPrice: null,
}

describe("sanitizeForWhatsapp", () => {
  it("strips newlines and control characters", () => {
    expect(sanitizeForWhatsapp("line one\nline two\r\n")).toBe(
      "line oneline two",
    )
  })

  it("strips WhatsApp markdown characters", () => {
    expect(sanitizeForWhatsapp("*bold* _italic_ ~strike~ `mono`")).toBe(
      "bold italic strike mono",
    )
  })

  it("leaves normal Spanish text intact", () => {
    expect(sanitizeForWhatsapp('Broca 1/4" en Acción °')).toBe(
      'Broca 1/4" en Acción °',
    )
  })
})

describe("buildWhatsappUrl", () => {
  it("builds a wa.me URL whose encoding round-trips", () => {
    const url = buildWhatsappUrl("522224417330", "hola *mundo*")

    expect(url).toBe(
      "https://wa.me/522224417330?text=" + encodeURIComponent("hola *mundo*"),
    )
    const [, encoded] = url.split("?text=")
    expect(decodeURIComponent(encoded)).toBe("hola *mundo*")
  })
})

describe("buildQuoteMessages — one part", () => {
  it("matches the Option A template for a priced line and a no-variant line", () => {
    const [message] = buildQuoteMessages(
      [pricedLine, noVariantLine],
      contact,
      "TH-260731-A4F2",
    )

    expect(message).toBe(
      [
        "*Solicitud de cotización* · TH-260731-A4F2",
        "",
        "Cliente: Rafael Moro",
        "Correo: rafael@example.com",
        "",
        '1) BRO-1234 · Broca Larga Acero A.V.',
        '   1/4" · 3 pz · $120.00 c/u · $360.00',
        "2) Sin clave interna · Llave Hexagonal Bondhus",
        "   Sin medida seleccionada · 2 pz",
        "",
        "*Subtotal (líneas con precio):* $360.00 MXN",
        "2 productos · 5 piezas · 1 línea sin medida",
      ].join("\n"),
    )
  })
})

describe("buildQuoteMessages — subtotal exclusion", () => {
  it("counts a no-variant line toward pieces/products but not the subtotal", () => {
    const [message] = buildQuoteMessages([noVariantLine], contact, "TH-REF")

    expect(message).toContain("*Subtotal (líneas con precio):* $0.00 MXN")
    expect(message).toContain("1 producto · 2 piezas · 1 línea sin medida")
  })
})

describe("buildQuoteMessages — forced split", () => {
  const manyLines: CartVariantLine[] = Array.from({ length: 40 }, (_, index) => ({
    productDocumentId: `prod-${index}`,
    productName: `Producto de prueba número ${index} con nombre bastante largo`,
    quantity: 1,
    variantDocumentId: `variant-${index}`,
    internalId: `SKU-${index}`,
    diameter: "1/2 in",
    unitPrice: 50,
  }))

  it("splits on a line boundary, keeping the reference and Parte N de M on every part", () => {
    const messages = buildQuoteMessages(manyLines, contact, "TH-SPLIT")

    expect(messages.length).toBeGreaterThan(1)

    for (const message of messages) {
      expect(message).toContain("TH-SPLIT")
      expect(message).toMatch(/Parte \d+ de \d+/)
      const encodedLength =
        encodeURIComponent(message).length + 40 // WHATSAPP_URL_PREFIX_MAX_LENGTH
      expect(encodedLength).toBeLessThanOrEqual(
        WHATSAPP_URL_MAX_ENCODED_LENGTH,
      )
    }

    expect(messages[0]).toContain("Cliente: Rafael Moro")
    expect(messages[0]).toContain("Correo: rafael@example.com")
    expect(messages[0]).toContain("*Subtotal (líneas con precio):*")
    for (const message of messages.slice(1)) {
      expect(message).not.toContain("Cliente:")
      expect(message).not.toContain("*Subtotal")
    }
  })

  it("numbers lines continuously across parts", () => {
    const messages = buildQuoteMessages(manyLines, contact, "TH-SPLIT")

    const allLineNumbers = messages
      .join("\n")
      .split("\n")
      .map((line) => line.match(/^(\d+)\) /))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => Number(match[1]))

    expect(allLineNumbers).toEqual(
      Array.from({ length: manyLines.length }, (_, index) => index + 1),
    )
  })

  it("never splits a line block mid-line", () => {
    const messages = buildQuoteMessages(manyLines, contact, "TH-SPLIT")

    for (const message of messages) {
      const numberedLines = message
        .split("\n")
        .filter((line) => /^\d+\) /.test(line))
      for (const numberedLine of numberedLines) {
        expect(message).toContain(numberedLine)
      }
    }
  })
})

describe("generateQuoteReference", () => {
  it("formats as PREFIX-yymmdd-XXXX", () => {
    const reference = generateQuoteReference(new Date(2026, 8, 13))

    expect(reference).toMatch(/^TH-260913-[0-9A-F]{4}$/)
  })
})
