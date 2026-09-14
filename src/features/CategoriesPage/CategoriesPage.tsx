import Link from "next/link"

import { CategoryCard } from "./CategoryCard"
import {
  WHATSAPP_HEADER_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/shared/constants/whatsapp.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"
import type { CategoryWithCount } from "@/shared/types/global.types"

export const CategoriesPage = ({ categories }: { categories: CategoryWithCount[] }) => {
  const whatsappUrl = WHATSAPP_NUMBER
    ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)
    : null

  return (
    <>
      <nav aria-label="Ruta">
        <ol className="flex gap-2 text-sm">
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page">Categorías</span>
          </li>
        </ol>
      </nav>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-sm font-semibold text-[#23890C] dark:text-[#4DF527]">
            Catálogo
          </p>
          <h1 className="text-[28px] font-bold md:text-4xl lg:text-5xl">
            Catálogo de herramienta industrial
          </h1>
          <p className="mt-3 text-muted">
            Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad.{" "}
            {categories.length} categorías con existencia en Puebla. Cotiza por
            WhatsApp.
          </p>
        </div>
        {whatsappUrl !== null && (
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
        )}
      </section>
      <p className="text-sm text-muted">{categories.length} categorías</p>
      {categories.length === 0 ? (
        <p>No hay categorías disponibles por ahora.</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
          {categories.map((category) => (
            <CategoryCard key={category.customId} category={category} />
          ))}
        </div>
      )}
    </>
  )
}
