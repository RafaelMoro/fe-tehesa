import { Button } from "@heroui/react"
import {
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiSearchLine,
  RiShieldCheckLine,
  RiTimeLine,
} from "@remixicon/react"

interface CatalogHeroProps {
  productCount?: number
  statusText?: string
  actionLabel?: string
  onAction?: () => void
  isDisabled?: boolean
}

export const CatalogHero = ({
  productCount,
  statusText,
  actionLabel = "Buscar en catálogo completo",
  onAction,
  isDisabled = false,
}: CatalogHeroProps) => (
  <section className="relative overflow-hidden rounded-[1.75rem] bg-emerald-950 text-white shadow-[0_25px_70px_rgba(15,72,4,0.16)] dark:border dark:border-white/10">
    <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full border-[70px] border-primary-200/12" />
    <div className="pointer-events-none absolute right-[28%] -bottom-28 size-64 rounded-full bg-primary-200/8 blur-3xl" />
    <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:px-12 lg:py-14">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-black tracking-[0.2em] text-primary-200 uppercase">
            Suministro industrial sin fricción
          </p>
          <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/80">
            {statusText ??
              (productCount == null
                ? "Cargando productos..."
                : `${productCount} ${productCount === 1 ? "producto" : "productos"}`)}
          </span>
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[0.98] font-black tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
          La pieza correcta, antes de que se detenga el taller.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
          Confirma medida, existencia y entrega en una sola vista. Precios por
          volumen para compras de una pieza o de toda la producción.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            variant="primary"
            className="font-black"
            onPress={onAction}
            isDisabled={isDisabled || !onAction}
          >
            <RiSearchLine aria-hidden="true" />
            {actionLabel}
            <RiArrowRightLine aria-hidden="true" />
          </Button>
          <span className="flex items-center gap-2 text-xs text-emerald-50/70">
            <RiCheckboxCircleFill
              className="text-primary-200"
              aria-hidden="true"
            />
            Sin registro · existencias actualizadas
          </span>
        </div>
      </div>
      <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <div className="rounded-2xl border border-white/12 bg-white/7 p-4 backdrop-blur-sm">
          <RiTimeLine className="text-primary-200" aria-hidden="true" />
          <p className="mt-3 text-2xl font-black">Mismo día</p>
          <p className="mt-1 text-xs text-white/60">
            Entrega local en zonas seleccionadas
          </p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/7 p-4 backdrop-blur-sm">
          <RiShieldCheckLine className="text-primary-200" aria-hidden="true" />
          <p className="mt-3 text-2xl font-black">Compra segura</p>
          <p className="mt-1 text-xs text-white/60">
            Garantía, devoluciones y factura CFDI
          </p>
        </div>
        <div className="rounded-2xl border border-primary-200/30 bg-primary-200 p-4 text-primary-950">
          <p className="text-[10px] font-black tracking-widest uppercase">
            Marcas para profesionales
          </p>
          <p className="mt-3 text-sm font-black">
            VÖLKEL · WESTON · FIRESTONE · TRUPER
          </p>
        </div>
      </aside>
    </div>
    <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[10px] font-bold tracking-wide text-white/55 uppercase sm:px-8 lg:px-12">
      <span>Envíos a todo México</span>
      <span>Atención técnica especializada</span>
      <span>Precios por volumen</span>
    </div>
  </section>
)
