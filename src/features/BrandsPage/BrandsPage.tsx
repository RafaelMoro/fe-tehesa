import Link from "next/link"

import { BrandCard } from "./BrandCard"
import type { BrandCardItem } from "./BrandCard"
import { CATEGORY_PAGE_HREFS } from "@/shared/constants/category.constants"
import {
  WHATSAPP_BRANDS_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/shared/constants/whatsapp.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"

const countFormatter = new Intl.NumberFormat("es-MX")

export const BrandsPage = ({ brands }: { brands: BrandCardItem[] }) => {
  const whatsappUrl = WHATSAPP_NUMBER
    ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_BRANDS_MESSAGE)
    : null
  const count =
    brands.length === 1
      ? "1 marca en almacén"
      : `${countFormatter.format(brands.length)} marcas en almacén`

  return (
    <>
      <nav aria-label="Ruta">
        <ol className="flex gap-2 text-sm">
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page">Marcas</span>
          </li>
        </ol>
      </nav>
      <div>
        <p className="text-sm font-semibold text-[#23890C] dark:text-[#4DF527]">
          Catálogo
        </p>
        <h1 className="text-[28px] font-bold md:text-4xl lg:text-5xl">
          Explora el catálogo por marca
        </h1>
        <p className="mt-3 text-muted">
          Siete marcas en almacén. Entra a la tuya y filtra por medida.
        </p>
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <p>{count}</p>
        <p>Ordenadas por fondo de catálogo</p>
      </div>
      {brands.length === 0 ? (
        <p>No hay marcas disponibles por ahora.</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] md:gap-5 md:[grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
          {brands.map((brand) => (
            <BrandCard key={brand.customId} brand={brand} />
          ))}
        </div>
      )}
      <p className="text-sm text-muted">
        La tornillería (tornillos, tuercas, pijas, rondanas, varilla) es de línea, sin
        marca:{" "}
        <Link href={CATEGORY_PAGE_HREFS.tornilleria}>búscala por categoría</Link>.
      </p>
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[14px] bg-[#0F2001] p-6 text-white">
        <div>
          <h2 className="text-xl font-bold">¿No ves tu marca?</h2>
          <p className="mt-2 text-white/80">
            El catálogo también se busca por categoría o directo por medida. Y si lo
            que usas no está aquí, mándanos la clave por WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/categorias"
            className="flex min-h-11 items-center rounded-lg bg-[#4DF527] px-4 font-semibold text-[#0D3401] hover:bg-[#3BD11A]"
          >
            Buscar por categoría
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
    </>
  )
}
