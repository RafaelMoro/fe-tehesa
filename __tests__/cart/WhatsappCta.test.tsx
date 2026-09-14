import { render, screen, userEvent } from "@__tests__/test-utils"
import { WhatsappCta } from "@/features/QuotePage/WhatsappCta"
import type { LineChecks } from "@/features/QuotePage/quote.utils"
import type { CartContact, CartVariantLine } from "@/shared/types/global.types"

// WHATSAPP_NUMBER is read once at module scope (mirrors SITE_URL's pattern
// in seo.constants.ts). A getter-backed mock lets each test flip the value
// without jest.resetModules(), which would also reset React itself and
// produce a duplicate-React "Invalid hook call" error.
let mockWhatsappNumber: string | undefined

jest.mock("@/shared/constants/whatsapp.constants", () => ({
  __esModule: true,
  get WHATSAPP_NUMBER() {
    return mockWhatsappNumber
  },
  WHATSAPP_URL_MAX_ENCODED_LENGTH: 1800,
  WHATSAPP_URL_PREFIX_MAX_LENGTH: 40,
  WHATSAPP_CONTROL_CHAR_PATTERN: /[\r\n\x00-\x1F\x7F]/g,
  WHATSAPP_MARKDOWN_CHAR_PATTERN: /[*_~`]/g,
  QUOTE_REFERENCE_PREFIX: "TH",
}))

const contact: CartContact = {
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@example.com",
}

const variantLine = (
  overrides: Partial<CartVariantLine> = {},
): CartVariantLine => ({
  productDocumentId: "prod-1",
  productName: "Tornillo",
  quantity: 1,
  variantDocumentId: "variant-1",
  diameter: "1/4 in",
  unitPrice: 10,
  ...overrides,
})

beforeEach(() => {
  mockWhatsappNumber = undefined
})

describe("WhatsappCta — disabled states", () => {
  it("renders an aria-disabled span with the missing-config copy when the env var is unset", () => {
    mockWhatsappNumber = undefined

    render(
      <WhatsappCta
        lines={[variantLine()]}
        checks={{}}
        contact={contact}
        onArchiveAndClear={jest.fn()}
      />,
    )

    expect(
      screen.getByText(
        "No podemos abrir WhatsApp porque falta la configuración de Tehesa. Inténtalo más tarde.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Cotizar" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Cotizar")).toHaveAttribute(
      "aria-disabled",
      "true",
    )
  })

  it("renders an aria-disabled span when the contact is missing", () => {
    mockWhatsappNumber = "522224417330"

    render(
      <WhatsappCta
        lines={[variantLine()]}
        checks={{}}
        contact={null}
        onArchiveAndClear={jest.fn()}
      />,
    )

    expect(
      screen.getByText("Completa tus datos de contacto para continuar."),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Cotizar" }),
    ).not.toBeInTheDocument()
  })

  it("renders an aria-disabled span when there are zero effective lines", () => {
    mockWhatsappNumber = "522224417330"
    const line = variantLine()
    const checks: LineChecks = {
      "prod-1:variant-1": { kind: "product-gone" },
    }

    render(
      <WhatsappCta
        lines={[line]}
        checks={checks}
        contact={contact}
        onArchiveAndClear={jest.fn()}
      />,
    )

    expect(
      screen.getByText("No hay líneas con datos suficientes para cotizar."),
    ).toBeInTheDocument()
  })
})

describe("WhatsappCta — single part", () => {
  it("renders one real anchor with the correct href and no stepper markup", () => {
    mockWhatsappNumber = "522224417330"

    render(
      <WhatsappCta
        lines={[variantLine()]}
        checks={{}}
        contact={contact}
        onArchiveAndClear={jest.fn()}
      />,
    )

    const link = screen.getByRole("link", { name: "Cotizar" })
    expect(link.getAttribute("href")).toEqual(
      expect.stringContaining("https://wa.me/522224417330?text="),
    )
    expect(screen.queryByText(/Parte \d+ de \d+/)).not.toBeInTheDocument()
  })
})

describe("WhatsappCta — multi-part", () => {
  const manyLines: CartVariantLine[] = Array.from({ length: 40 }, (_, index) =>
    variantLine({
      productDocumentId: `prod-${index}`,
      productName: `Producto de prueba número ${index} con nombre bastante largo`,
      variantDocumentId: `variant-${index}`,
      internalId: `SKU-${index}`,
    }),
  )

  it("renders N part links in order, marks a clicked part opened and re-clickable", async () => {
    const user = userEvent.setup()
    mockWhatsappNumber = "522224417330"

    render(
      <WhatsappCta
        lines={manyLines}
        checks={{}}
        contact={contact}
        onArchiveAndClear={jest.fn()}
      />,
    )

    const partLinks = screen.getAllByRole("link", {
      name: /Abrir parte \d+ de \d+ en WhatsApp/,
    })
    expect(partLinks.length).toBeGreaterThan(1)
    expect(partLinks[0]).toHaveAccessibleName(
      `Abrir parte 1 de ${partLinks.length} en WhatsApp`,
    )

    await user.click(partLinks[0]);

    expect(
      await screen.findByRole("link", { name: "Volver a abrir" }),
    ).toBeInTheDocument()
  })

  it("shows Empezar una nueva cotización only once every part is opened, and calls onArchiveAndClear once", async () => {
    const user = userEvent.setup()
    mockWhatsappNumber = "522224417330"
    const onArchiveAndClear = jest.fn()

    render(
      <WhatsappCta
        lines={manyLines}
        checks={{}}
        contact={contact}
        onArchiveAndClear={onArchiveAndClear}
      />,
    )

    expect(
      screen.queryByRole("button", { name: "Empezar una nueva cotización" }),
    ).not.toBeInTheDocument()

    let pendingLinks = screen.queryAllByRole("link", {
      name: /Abrir parte \d+ de \d+ en WhatsApp/,
    })
    while (pendingLinks.length > 0) {
      await user.click(pendingLinks[0])
      pendingLinks = screen.queryAllByRole("link", {
        name: /Abrir parte \d+ de \d+ en WhatsApp/,
      })
    }

    const finishButton = await screen.findByRole("button", {
      name: "Empezar una nueva cotización",
    })
    await user.click(finishButton)

    expect(onArchiveAndClear).toHaveBeenCalledTimes(1)
  })
})
