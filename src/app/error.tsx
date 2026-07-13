"use client"

import { Button } from "@heroui/react"
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react"

import { CatalogDisabledFilters } from "@/features/Home/CatalogDisabledFilters"
import { CatalogHero } from "@/features/Home/CatalogHero"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <CatalogPageLayout themeFetched="light">
      <CatalogHero statusText="No pudimos cargar los productos." isDisabled />
      <CatalogDisabledFilters />
      <section
        className="grid overflow-hidden rounded-xl border border-default-200 lg:grid-cols-[minmax(0,1fr)_250px]"
        role="alert"
      >
        <div className="flex gap-5 p-6 sm:p-10">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-danger text-danger">
            <RiErrorWarningLine aria-hidden="true" size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-danger uppercase">
              No se pudo completar la carga
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              No pudimos cargar los productos
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Ocurrió un problema al consultar el catálogo. Tus filtros siguen
              guardados; intenta nuevamente o restablécelos para comenzar otra
              búsqueda.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" onPress={reset}>
                <RiRefreshLine aria-hidden="true" />
                Intentar de nuevo
              </Button>
              <Button
                variant="secondary"
                onPress={() => window.location.assign("/?page=1")}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
        <aside className="border-t border-default-200 bg-default-50 p-6 lg:border-t-0 lg:border-l">
          <h3 className="font-medium">Mientras tanto puedes</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>Verificar tu conexión</li>
            <li>Intentar de nuevo en unos segundos</li>
            <li>Conservar la búsqueda actual</li>
          </ul>
        </aside>
      </section>
    </CatalogPageLayout>
  )
}
