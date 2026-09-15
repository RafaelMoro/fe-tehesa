"use client"

import { Button } from "@heroui/react"
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react"

export const CategoryPageError = ({
  categoryName,
  reset,
}: {
  categoryName: string
  reset: () => void
}) => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
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
              No pudimos cargar los productos de {categoryName}
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Ocurrió un problema al consultar los productos de esta categoría.
              Intenta nuevamente en unos segundos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" onPress={reset}>
                <RiRefreshLine aria-hidden="true" />
                Intentar de nuevo
              </Button>
              <Button
                variant="secondary"
                onPress={() => window.location.assign("/categorias")}
              >
                Ver todas las categorías
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
