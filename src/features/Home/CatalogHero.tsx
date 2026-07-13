import { Button } from "@heroui/react"
import { RiSearchLine, RiShareLine } from "@remixicon/react"

interface CatalogHeroProps {
  productCount?: number
  onOpenCatalogSearch?: () => void
  isDisabled?: boolean
}

export const CatalogHero = ({
  productCount,
  onOpenCatalogSearch,
  isDisabled = false,
}: CatalogHeroProps) => (
  <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
        Suministro industrial
      </p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Piezas precisas para trabajo exigente.
      </h1>
      <p className="max-w-xl text-muted">
        Compara rangos de precio y consulta las dimensiones disponibles antes de
        elegir una variante.
      </p>
    </div>
    <div className="flex w-full flex-col gap-3 lg:max-w-85 lg:items-end">
      <p className="text-sm text-muted">
        {productCount == null
          ? "Cargando productos..."
          : `${productCount} ${productCount === 1 ? "producto" : "productos"}`}
      </p>
      <aside className="w-full rounded-xl bg-emerald-950 p-5 text-white dark:bg-emerald-950">
        <div className="flex items-center gap-3">
          <RiShareLine aria-hidden="true" size={18} />
          <h2 className="font-semibold">Búsqueda ampliada</h2>
        </div>
        <p className="mt-2 text-sm text-emerald-50">
          Explora todo el catálogo y encuentra coincidencias fuera de los filtros
          actuales.
        </p>
        <Button
          fullWidth
          className="mt-4"
          variant="primary"
          onPress={onOpenCatalogSearch}
          isDisabled={isDisabled || !onOpenCatalogSearch}
        >
          Buscar en catálogo completo
          <RiSearchLine aria-hidden="true" />
        </Button>
      </aside>
    </div>
  </section>
)
