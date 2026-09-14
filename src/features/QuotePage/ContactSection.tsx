"use client"

import { useEffect, useState } from "react"
import { AlertDialog, Button } from "@heroui/react"

import { useCartStore } from "@/zustand/provider/cart.provider"
import { validateContact } from "@/shared/utils/contact-validation.utils"
import type { CartContact } from "@/shared/types/global.types"
import { ContactForm } from "./ContactForm"

const ContactSummaryField = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
)

export const ContactSection = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const rawContact = useCartStore((store) => store.contact)
  const setContact = useCartStore((store) => store.setContact)
  const clearContact = useCartStore((store) => store.clearContact)

  const [formOverride, setFormOverride] = useState(false)

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-32 animate-pulse rounded-lg border border-default-200 bg-default-50"
      />
    )
  }

  const { contact: validContact, partial } = validateContact(rawContact)
  const mode = validContact && !formOverride ? "summary" : "form"

  const handleSubmitValid = (contact: CartContact) => {
    setContact(contact)
    setFormOverride(false)
  }

  if (mode === "summary" && validContact) {
    return (
      <section className="flex flex-col gap-4 rounded-lg border border-default-200 p-4">
        <h2 className="font-semibold">Tus datos de contacto</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ContactSummaryField label="Nombre" value={validContact.firstName} />
          <ContactSummaryField label="Apellidos" value={validContact.lastName} />
          <ContactSummaryField label="Correo" value={validContact.email} />
        </div>
        <p className="text-sm text-muted">Solo en este dispositivo</p>
        <div className="flex items-center gap-4">
          <Button variant="secondary" onPress={() => setFormOverride(true)}>
            Usar otros datos
          </Button>
          <AlertDialog>
            <AlertDialog.Trigger>
              <Button variant="tertiary">Olvidar mis datos</Button>
            </AlertDialog.Trigger>
            <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
              <AlertDialog.Container placement="center">
                <AlertDialog.Dialog>
                  {({ close }) => (
                    <>
                      <AlertDialog.Header>
                        <AlertDialog.Heading>
                          ¿Olvidar tus datos guardados?
                        </AlertDialog.Heading>
                      </AlertDialog.Header>
                      <AlertDialog.Body>
                        Se borrarán tu nombre, apellidos y correo guardados en
                        este dispositivo. Tu lista de productos no se ve
                        afectada.
                      </AlertDialog.Body>
                      <AlertDialog.Footer>
                        <Button variant="secondary" autoFocus onPress={close}>
                          Cancelar
                        </Button>
                        <Button
                          variant="danger"
                          onPress={() => {
                            clearContact()
                            close()
                          }}
                        >
                          Olvidar mis datos
                        </Button>
                      </AlertDialog.Footer>
                    </>
                  )}
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-default-200 p-4">
      <h2 className="font-semibold">Tus datos de contacto</h2>
      <ContactForm
        defaultValues={validContact ?? partial}
        onSubmitValid={handleSubmitValid}
        onCancel={validContact ? () => setFormOverride(false) : undefined}
      />
    </section>
  )
}
