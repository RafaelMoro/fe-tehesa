import {
  QUOTE_REFERENCE_PREFIX,
  WHATSAPP_CONTROL_CHAR_PATTERN,
  WHATSAPP_MARKDOWN_CHAR_PATTERN,
  WHATSAPP_URL_MAX_ENCODED_LENGTH,
  WHATSAPP_URL_PREFIX_MAX_LENGTH,
} from "@/shared/constants/whatsapp.constants"
import type { CartContact, CartLine } from "@/shared/types/global.types"

export const sanitizeForWhatsapp = (value: string): string =>
  value
    .replace(WHATSAPP_CONTROL_CHAR_PATTERN, "")
    .replace(WHATSAPP_MARKDOWN_CHAR_PATTERN, "")

export const generateQuoteReference = (now: Date = new Date()): string => {
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const hex = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .padStart(4, "0")
    .toUpperCase()

  return `${QUOTE_REFERENCE_PREFIX}-${yy}${mm}${dd}-${hex}`
}

export const buildWhatsappUrl = (waNumber: string, message: string): string =>
  `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`

const formatCents = (cents: number): string => `$${(cents / 100).toFixed(2)}`

const getInternalId = (line: CartLine): string | undefined =>
  "internalId" in line ? line.internalId : undefined

const measureUrlLength = (text: string): number =>
  encodeURIComponent(text).length + WHATSAPP_URL_PREFIX_MAX_LENGTH

const renderLineBlock = (line: CartLine, lineNumber: number): string => {
  const internalId = getInternalId(line)
  const label = internalId
    ? sanitizeForWhatsapp(internalId)
    : "Sin clave interna"
  const productName = sanitizeForWhatsapp(line.productName)
  const heading = `${lineNumber}) ${label} · ${productName}`

  if (line.variantDocumentId === null) {
    return `${heading}\n   Sin variante seleccionada · ${line.quantity} pz`
  }

  const diameter = sanitizeForWhatsapp(line.diameter)
  const unitCents = Math.round(line.unitPrice * 100)
  const lineTotalCents = unitCents * line.quantity

  return `${heading}\n   ${diameter} · ${line.quantity} pz · ${formatCents(unitCents)} c/u · ${formatCents(lineTotalCents)}`
}

const buildContactBlock = (contact: CartContact): string =>
  `Cliente: ${sanitizeForWhatsapp(contact.firstName)} ${sanitizeForWhatsapp(contact.lastName)}\nCorreo: ${sanitizeForWhatsapp(contact.email)}`

const buildSummaryBlock = (lines: CartLine[]): string => {
  let subtotalCents = 0
  let pieceCount = 0
  let noVariantCount = 0

  for (const line of lines) {
    pieceCount += line.quantity
    if (line.variantDocumentId === null) {
      noVariantCount += 1
      continue
    }
    subtotalCents += Math.round(line.unitPrice * 100) * line.quantity
  }

  const productCount = lines.length
  const noVariantSuffix =
    noVariantCount > 0
      ? ` · ${noVariantCount} línea${noVariantCount === 1 ? "" : "s"} sin variante`
      : ""

  return `*Subtotal (líneas con precio):* ${formatCents(subtotalCents)} MXN\n${productCount} producto${productCount === 1 ? "" : "s"} · ${pieceCount} pieza${pieceCount === 1 ? "" : "s"}${noVariantSuffix}`
}

const buildSingleHeader = (reference: string): string =>
  `*Solicitud de cotización* · ${reference}`

const buildPartHeader = (
  reference: string,
  partNumber: number,
  totalParts: number,
): string =>
  `*Solicitud de cotización* · ${reference} — Parte ${partNumber} de ${totalParts}`

// Overhead is measured with worst-case 3-digit part numbers (CART_MAX_LINES
// caps a cart at 100 lines, so M can reach 3 digits): the real header, once
// M is known, is never longer than this placeholder, so a part that fits
// here always fits with its real header too.
const PLACEHOLDER_PART_NUMBER = 999

type PackedPart = {
  lineBlocks: string[]
  includesSummary: boolean
}

const packLineBlocks = (
  lineBlocks: string[],
  reference: string,
  contactBlock: string,
  summaryBlock: string,
): PackedPart[] => {
  const parts: PackedPart[] = []
  let currentBlocks: string[] = []
  let isFirstPart = true

  const overheadFor = (first: boolean): string => {
    const header = buildPartHeader(
      reference,
      PLACEHOLDER_PART_NUMBER,
      PLACEHOLDER_PART_NUMBER,
    )
    if (first) {
      return `${header}\n\n${contactBlock}\n\n${summaryBlock}\n\n`
    }
    return `${header}\n\n`
  }

  for (const block of lineBlocks) {
    const candidateBlocks = [...currentBlocks, block]
    const candidateText = overheadFor(isFirstPart) + candidateBlocks.join("\n")

    if (
      currentBlocks.length > 0 &&
      measureUrlLength(candidateText) > WHATSAPP_URL_MAX_ENCODED_LENGTH
    ) {
      parts.push({ lineBlocks: currentBlocks, includesSummary: isFirstPart })
      isFirstPart = false
      currentBlocks = [block]
    } else {
      currentBlocks = candidateBlocks
    }
  }

  if (currentBlocks.length > 0) {
    parts.push({ lineBlocks: currentBlocks, includesSummary: isFirstPart })
  }

  return parts
}

export const buildQuoteMessages = (
  lines: CartLine[],
  contact: CartContact,
  reference: string = generateQuoteReference(),
): string[] => {
  const lineBlocks = lines.map((line, index) => renderLineBlock(line, index + 1))
  const contactBlock = buildContactBlock(contact)
  const summaryBlock = buildSummaryBlock(lines)

  const singleMessage = `${buildSingleHeader(reference)}\n\n${contactBlock}\n\n${lineBlocks.join("\n")}\n\n${summaryBlock}`

  if (measureUrlLength(singleMessage) <= WHATSAPP_URL_MAX_ENCODED_LENGTH) {
    return [singleMessage]
  }

  const parts = packLineBlocks(lineBlocks, reference, contactBlock, summaryBlock)
  const totalParts = parts.length

  return parts.map((part, index) => {
    const header = buildPartHeader(reference, index + 1, totalParts)
    if (part.includesSummary) {
      return `${header}\n\n${contactBlock}\n\n${summaryBlock}\n\n${part.lineBlocks.join("\n")}`
    }
    return `${header}\n\n${part.lineBlocks.join("\n")}`
  })
}
