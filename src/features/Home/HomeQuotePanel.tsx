import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import {
  WHATSAPP_HEADER_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/shared/constants/whatsapp.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"

export const HomeQuotePanel = () => {
  const whatsappUrl = WHATSAPP_NUMBER
    ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)
    : null

  return (
    <section className="flex flex-wrap items-center justify-between gap-6 rounded-[14px] bg-[#0F2001] p-6 text-white">
      <div>
        <h2 className="text-xl font-bold">Ya tienes la lista?</h2>
        <p className="mt-2 text-white/80">
          Tu lista llega con la clave de cada parte ya puesta. Un vendedor de
          Tehesa te regresa la cotización formal.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cotizar"
          className="flex min-h-11 items-center gap-2 rounded-lg bg-[#4DF527] px-4 font-semibold text-[#0D3401] hover:bg-[#3BD11A]"
        >
          Ver mi lista de cotización
          <RiArrowRightLine aria-hidden="true" size={16} />
        </Link>
        {whatsappUrl !== null && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-lg border border-white/25 px-4 font-semibold hover:bg-white/10"
          >
            Cotizar por WhatsApp
          </a>
        )}
      </div>
    </section>
  )
}
