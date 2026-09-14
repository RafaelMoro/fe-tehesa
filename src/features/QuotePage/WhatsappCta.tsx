"use client"

import { useState } from "react"
import { Button } from "@heroui/react"

import { WHATSAPP_NUMBER } from "@/shared/constants/whatsapp.constants"
import { validateContact } from "@/shared/utils/contact-validation.utils"
import {
  buildQuoteMessages,
  buildWhatsappUrl,
} from "@/shared/utils/whatsapp-message.utils"
import type { CartContact, CartLine } from "@/shared/types/global.types"
import { getEffectiveLines, type LineChecks } from "./quote.utils"

interface WhatsappCtaProps {
  lines: CartLine[]
  checks: LineChecks
  contact: CartContact | null
  onArchiveAndClear: () => void
}

const DisabledCta = ({
  message,
  note,
}: {
  message: string
  note?: string
}) => (
  <div className="rounded-lg border border-default-200 p-4">
    <span
      aria-disabled="true"
      className="inline-block cursor-not-allowed rounded-lg bg-default-100 px-4 py-2 font-semibold text-muted"
    >
      Cotizar
    </span>
    <p className="mt-2 text-sm text-muted">{message}</p>
    {note && <p className="text-sm text-muted">{note}</p>}
  </div>
)

export const WhatsappCta = ({
  lines,
  checks,
  contact,
  onArchiveAndClear,
}: WhatsappCtaProps) => {
  const [openedParts, setOpenedParts] = useState<Set<number>>(new Set())

  const effectiveLines = getEffectiveLines(lines, checks)
  const validContact = validateContact(contact).contact

  const waNumber = WHATSAPP_NUMBER
  if (!waNumber) {
    return (
      <DisabledCta
        message="No podemos abrir WhatsApp porque falta la configuración de Tehesa. Inténtalo más tarde."
        note="Tus datos y tu lista permanecen guardados en este dispositivo."
      />
    )
  }

  if (!validContact) {
    return (
      <DisabledCta message="Completa tus datos de contacto para continuar." />
    )
  }

  if (effectiveLines.length === 0) {
    return (
      <DisabledCta message="No hay líneas con datos suficientes para cotizar." />
    )
  }

  const messages = buildQuoteMessages(effectiveLines, validContact)
  const urls = messages.map((message) => buildWhatsappUrl(waNumber, message))

  const markOpened = (index: number) => {
    setOpenedParts((current) => new Set(current).add(index))
  }

  if (urls.length === 1) {
    return (
      <div className="rounded-lg border border-default-200 p-4">
        <a
          href={urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => markOpened(0)}
          className="inline-block rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          Cotizar
        </a>
        <p className="mt-2 text-sm text-muted">
          Se abrirá WhatsApp con el mensaje preparado. Tú decides si lo
          envías.
        </p>
      </div>
    )
  }

  const totalParts = urls.length
  const allOpened = openedParts.size === totalParts
  const nextPendingIndex = urls.findIndex((_, index) => !openedParts.has(index))

  const headline = allOpened
    ? `Abriste las ${totalParts} partes en WhatsApp`
    : openedParts.size === 0
      ? `Esta cotización necesita ${totalParts} partes`
      : `Continúa con la parte ${nextPendingIndex + 1} de ${totalParts}`

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-default-200 p-4">
      <p className="font-semibold">{headline}</p>
      {allOpened && (
        <p className="text-sm text-muted">
          No podemos confirmar si las enviaste. Puedes volver a abrir
          cualquier parte.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {urls.map((url, index) => {
          const isOpened = openedParts.has(index)
          return (
            <li
              key={index}
              className="flex items-center justify-between gap-3 rounded-lg border border-default-200 p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  Parte {index + 1} de {totalParts}
                </p>
                <p className="text-sm text-muted">
                  {isOpened
                    ? "Abierta en WhatsApp · vuelve a abrirla si hace falta"
                    : "Pendiente"}
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markOpened(index)}
                className="whitespace-nowrap text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
              >
                {isOpened
                  ? "Volver a abrir"
                  : `Abrir parte ${index + 1} de ${totalParts} en WhatsApp`}
              </a>
            </li>
          )
        })}
      </ul>
      {allOpened && (
        <Button onPress={onArchiveAndClear}>Empezar una nueva cotización</Button>
      )}
    </div>
  )
}
