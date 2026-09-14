import {
  WHATSAPP_HEADER_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/shared/constants/whatsapp.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"

export const WhatsappPanel = () => {
  const whatsappUrl = WHATSAPP_NUMBER
    ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)
    : null

  if (whatsappUrl === null) {
    return null
  }

  return (
    <aside className="rounded-[14px] bg-[#0F2001] p-6 text-white">
      <h2 className="text-lg font-semibold">Cotiza por WhatsApp</h2>
      <p className="mt-2 text-sm text-white/80">
        Envía tu lista de medidas y cantidades; confirmamos existencia el mismo
        día.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-[#4DF527] px-4 font-semibold text-[#0D3401]"
      >
        Cotizar ahora
      </a>
    </aside>
  )
}
