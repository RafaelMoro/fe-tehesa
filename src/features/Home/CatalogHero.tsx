import { Button } from "@heroui/react"
import { RiSearchLine } from "@remixicon/react"

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
  actionLabel = "Buscar en todo el catálogo",
  onAction,
  isDisabled = false,
}: CatalogHeroProps) => (
  <section className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8 flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-[#23890C] uppercase dark:text-[#4DF527]">
        Catálogo con precio · Puebla
      </p>
      <h1 className="text-[28px] font-bold tracking-tight md:text-4xl lg:text-5xl">
        Distribuidor de herramienta industrial en Puebla
      </h1>
      <p className="max-w-xl text-muted">
        Busca por categoría, por marca o por nombre de producto. Cada medida
        trae su precio y su clave de parte; pon cantidades y manda la lista a
        cotizar.
      </p>
    </div>
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm text-muted">
        {statusText ??
          (productCount == null
            ? "Contando productos…"
            : `${productCount} ${productCount === 1 ? "producto" : "productos"}`)}
      </p>
      <aside className="w-full rounded-xl bg-[#0F2001] p-5 text-white">
        <div className="flex items-center gap-3">
          <RiSearchLine aria-hidden="true" size={18} />
          <h2 className="font-semibold">¿No aparece con los filtros?</h2>
        </div>
        <p className="mt-2 text-sm text-white/80">
          Busca en el catálogo completo por nombre de producto. Si tampoco así,
          mándanos la clave o la medida por WhatsApp y te decimos si la
          manejamos.
        </p>
        <Button
          fullWidth
          className="mt-4"
          variant="primary"
          onPress={onAction}
          isDisabled={isDisabled || !onAction}
        >
          {actionLabel}
          <RiSearchLine aria-hidden="true" />
        </Button>
        <p className="mt-3 text-xs text-white/70">
          Elige categoría o marca, una a la vez. La búsqueda por nombre
          reemplaza el filtro activo.
        </p>
      </aside>
    </div>
  </section>
)
