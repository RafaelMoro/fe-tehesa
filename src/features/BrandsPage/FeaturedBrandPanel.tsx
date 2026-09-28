import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { BRAND_PAGE_HREFS } from "@/shared/constants/brand.constants"
import type { BrandCardItem } from "./BrandCard"

export const FeaturedBrandPanel = ({ brand }: { brand: BrandCardItem }) => (
  <section className="relative grid items-end gap-12 overflow-hidden rounded-[18px] bg-[#1B1C1F] p-5 text-[#F4F4F5] transition-transform md:p-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-[52px]">
    <span
      aria-hidden="true"
      className="absolute -top-[60px] -right-[60px] hidden size-[260px] rounded-full border-[40px] border-[#FF6A1A] opacity-90 lg:block"
    />
    <div className="relative flex flex-col items-start gap-[18px]">
      <p className="rounded-[4px] bg-[#FF6A1A] px-[10px] py-[5px] text-xs font-bold tracking-[0.1em] text-[#1B1C1F] uppercase">
        Marca diferenciadora
      </p>
      <h2 className="text-[28px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[36px] lg:text-[46px]">
        BOHRCRAFT — <span className="text-[#FF8A4C]">Precisión alemana</span>
      </h2>
      <p className="max-w-[620px] text-base leading-[1.6] text-[#B4B6BC]">
        Nuestra marca diferenciadora. Bohrcraft fabrica en Alemania brocas y machuelos de
        precisión para trabajos donde la tolerancia no admite error. Es una marca que la
        mayoría de los distribuidores de la región no maneja, y que nosotros tenemos
        disponible de forma directa.
      </p>
      <Link
        href={BRAND_PAGE_HREFS.bohrcraft}
        className="flex min-h-[52px] items-center gap-2 rounded-full bg-[#FF6A1A] px-[26px] text-base font-bold text-[#1B1C1F] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#FF6A1A]"
      >
        Ver catálogo Bohrcraft
        <RiArrowRightLine aria-hidden="true" className="size-4" />
      </Link>
    </div>
    <div className="relative flex h-[170px] w-full max-w-[340px] -rotate-2 items-center justify-center rounded-xl bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,.4)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- D8: plain <img>, Cloudinary already serves sized WebP */}
      <img
        src={brand.logo.src}
        width={brand.logo.width}
        height={brand.logo.height}
        alt="Bohrcraft"
        loading="lazy"
        className="max-h-[100px] max-w-full object-contain"
      />
    </div>
  </section>
)
