export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
export const WHATSAPP_URL_MAX_ENCODED_LENGTH = 1800
export const WHATSAPP_URL_PREFIX_MAX_LENGTH = 40 // safe upper bound for `https://wa.me/<15-digit number>?text=`
export const WHATSAPP_CONTROL_CHAR_PATTERN = /[\r\n\x00-\x1F\x7F]/g
export const WHATSAPP_MARKDOWN_CHAR_PATTERN = /[*_~`]/g
export const QUOTE_REFERENCE_PREFIX = "TH"
export const WHATSAPP_HEADER_MESSAGE =
  "Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar?"
