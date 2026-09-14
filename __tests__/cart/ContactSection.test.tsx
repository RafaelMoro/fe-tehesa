import { useEffect, useState } from "react"
import { render, screen, userEvent, waitFor, within } from "@__tests__/test-utils"
import { ContactSection } from "@/features/QuotePage/ContactSection"
import { useCartStore } from "@/zustand/provider/cart.provider"
import {
  CART_SCHEMA_VERSION,
  CART_STORAGE_KEY,
} from "@/shared/constants/cart.constants"
import type { CartContact } from "@/shared/types/global.types"

// The persisted-state boundary (cart.store.ts's sanitizeCartState) already
// nulls a half-valid contact all-or-nothing on rehydrate, so a partial
// record can only reach ContactSection's own defensive re-validation via an
// in-memory write that bypasses that boundary — exactly the "again at
// message-build time" half of AC 1c, exercised here by seeding the store
// directly instead of through localStorage.
// ContactSection mounts a fresh ContactForm capturing defaultValues once;
// this seeds the corrupted contact into the store before ContactSection
// ever renders, instead of racing it in as a sibling effect.
const SeedCorruptContactThenRenderSection = ({
  contact,
}: {
  contact: Record<string, string>
}) => {
  const setContact = useCartStore((store) => store.setContact)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    setContact(contact as CartContact)
    setSeeded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!seeded) {
    return null
  }

  return <ContactSection />
}

const seedContact = (contact: Partial<CartContact> | null) => {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      state: { lines: [], contact },
      version: CART_SCHEMA_VERSION,
    }),
  )
}

const validContact: CartContact = {
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@example.com",
}

beforeEach(() => {
  localStorage.clear()
})

describe("ContactSection — no saved contact", () => {
  it("renders the form expanded", async () => {
    render(<ContactSection />)

    expect(await screen.findByLabelText("Nombre")).toBeInTheDocument()
    expect(screen.getByLabelText("Apellidos")).toBeInTheDocument()
    expect(screen.getByLabelText("Correo")).toBeInTheDocument()
  })
})

describe("ContactSection — valid saved contact", () => {
  it("shows the read-only summary, not the form", async () => {
    seedContact(validContact)

    render(<ContactSection />)

    expect(await screen.findByText("ana@example.com")).toBeInTheDocument()
    expect(screen.getByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("Pérez")).toBeInTheDocument()
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument()
  })

  it("Usar otros datos reveals a form prefilled with the saved contact", async () => {
    const user = userEvent.setup()
    seedContact(validContact)
    render(<ContactSection />)
    await screen.findByText("ana@example.com")

    await user.click(screen.getByRole("button", { name: "Usar otros datos" }))

    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Pérez")).toBeInTheDocument()
    expect(screen.getByDisplayValue("ana@example.com")).toBeInTheDocument()
  })

  it("Cancelar cambios discards the edit and returns to the summary", async () => {
    const user = userEvent.setup()
    seedContact(validContact)
    render(<ContactSection />)
    await screen.findByText("ana@example.com")

    await user.click(screen.getByRole("button", { name: "Usar otros datos" }))
    await screen.findByDisplayValue("Ana")
    await user.click(
      screen.getByRole("button", { name: "Cancelar cambios" }),
    )

    expect(await screen.findByText("ana@example.com")).toBeInTheDocument()
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument()
  })

  it("Olvidar mis datos clears the contact after confirmation", async () => {
    const user = userEvent.setup()
    seedContact(validContact)
    render(<ContactSection />)
    await screen.findByText("ana@example.com")

    await user.click(
      screen.getAllByRole("button", { name: "Olvidar mis datos" })[0],
    )
    const dialog = await screen.findByRole("alertdialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Olvidar mis datos" }),
    )

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    )
    expect(await screen.findByLabelText("Nombre")).toBeInTheDocument()
    expect(screen.queryByText("ana@example.com")).not.toBeInTheDocument()
  })
})

describe("ContactSection — invalid/partial saved contact", () => {
  it("shows the form prefilled with only the surviving fields", async () => {
    render(
      <SeedCorruptContactThenRenderSection
        contact={{ firstName: "Ana", lastName: "Pérez", email: "bad-email" }}
      />,
    )

    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Pérez")).toBeInTheDocument()
    expect(screen.getByLabelText("Correo")).toHaveValue("")
  })
})

describe("ContactSection — form submission", () => {
  it("valid submit collapses to the summary and persists the contact", async () => {
    const user = userEvent.setup()
    render(<ContactSection />)
    await screen.findByLabelText("Nombre")

    await user.type(screen.getByLabelText("Nombre"), "Ana")
    await user.type(screen.getByLabelText("Apellidos"), "Pérez")
    await user.type(screen.getByLabelText("Correo"), "ana@example.com")
    await user.click(screen.getByRole("button", { name: "Guardar datos" }))

    expect(await screen.findByText("ana@example.com")).toBeInTheDocument()
    expect(
      JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "{}").state
        .contact,
    ).toEqual({ firstName: "Ana", lastName: "Pérez", email: "ana@example.com" })
  })
})
