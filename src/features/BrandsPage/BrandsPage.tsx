import Link from "next/link"

import { BrandCard } from "./BrandCard"
import type { BrandCardItem } from "./BrandCard"
import { FeaturedBrandPanel } from "./FeaturedBrandPanel"
import {
  BRAND_PAGES,
  BRANDS_FEATURED_ID,
  BRANDS_HERO_PHOTO,
  BRANDS_INDEX_ORDER,
} from "@/shared/constants/brand.constants"
import { CATEGORY_PAGE_HREFS } from "@/shared/constants/category.constants"
import {
  WHATSAPP_BRANDS_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/shared/constants/whatsapp.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"

const toItem = (customId: string): BrandCardItem | null => {
  const config = BRAND_PAGES[customId]

  if (config === undefined) {
    return null
  }

  return { customId, ...config }
}

export const BrandsPage = ({ liveBrandIds }: { liveBrandIds: string[] }) => {
  const live = new Set(liveBrandIds)
  const pickLive = (customId: string): BrandCardItem | null => {
    const item = toItem(customId)

    return item !== null && live.has(customId) ? item : null
  }
  const featured = pickLive(BRANDS_FEATURED_ID)
  const brands = BRANDS_INDEX_ORDER.map(pickLive).filter(
    (item): item is BrandCardItem => item !== null,
  )
  const whatsappUrl = WHATSAPP_NUMBER
    ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_BRANDS_MESSAGE)
    : null

  return (
    <>
      <nav aria-label="Ruta" className="py-[22px] text-[13px] text-gray-500 dark:text-gray-400">
        <ol className="flex gap-2">
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page">Marcas</span>
          </li>
        </ol>
      </nav>

      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="flex max-w-[600px] flex-col gap-5">
          <p className="w-fit rounded-full bg-[#4DF527] px-[14px] py-[6px] text-xs font-semibold tracking-[0.04em] text-[#0D3401] uppercase">
            Distribuidor directo
          </p>
          <h1 className="text-[32px] leading-[1.05] font-extrabold tracking-[-0.02em] text-gray-900 md:text-[40px] lg:text-[56px] dark:text-white">
            Marcas que distribuimos
          </h1>
          <span aria-hidden="true" className="h-1 w-[88px] rounded-full bg-[#4DF527]" />
          <p className="text-[17px] leading-[1.6] text-gray-700 dark:text-gray-300">
            En más de 20 años abasteciendo a la industria poblana, hemos elegido trabajar
            con las marcas que resisten el uso exigente. Somos distribuidores directos: eso
            significa mejor precio, existencia real y respaldo técnico sobre cada
            herramienta que sale de nuestro almacén.
          </p>
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-[10px] bg-gray-50 dark:bg-[#12250A]">
          {/* eslint-disable-next-line @next/next/no-img-element -- D8: plain <img>, Cloudinary already serves sized WebP */}
          <img
            src={BRANDS_HERO_PHOTO.src}
            alt={BRANDS_HERO_PHOTO.alt}
            width={BRANDS_HERO_PHOTO.width}
            height={BRANDS_HERO_PHOTO.height}
            className="size-full object-cover object-[44%_50%]"
          />
        </div>
      </section>

      {featured !== null && <FeaturedBrandPanel brand={featured} />}

      {brands.length > 0 ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-3 pt-[72px]">
            <h2 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] text-gray-900 dark:text-white">
              El resto del catálogo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cada marca abre el catálogo filtrado
            </p>
          </div>
          <div className="grid gap-4 pt-6 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] md:gap-5 md:[grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
            {brands.map((brand) => (
              <BrandCard key={brand.customId} brand={brand} />
            ))}
          </div>
        </>
      ) : (
        featured === null && <p>No hay marcas disponibles por ahora.</p>
      )}

      <p className="mt-7 max-w-[760px] text-sm leading-[1.6] text-gray-600 dark:text-gray-400">
        La tornillería (tornillos, tuercas, pijas, rondanas, varilla) es de línea, sin
        marca:{" "}
        <Link href={CATEGORY_PAGE_HREFS.tornilleria} className="font-semibold">
          búscala por categoría
        </Link>
        .
      </p>

      <section className="my-14 flex flex-wrap items-center justify-between gap-7 rounded-[14px] bg-[#0F2001] p-8 text-white">
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
