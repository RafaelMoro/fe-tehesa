import { Button, Input, Label, TextField } from "@heroui/react"
import { RiSearchLine, RiShareLine } from "@remixicon/react"

import { Header } from "@/shared/ui/organisms/Header"

export default function Loading() {
  return (
    <div>
      <Header themeFetched="light" />
      <main className="flex flex-col gap-7 p-4 sm:p-6">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
              Suministro industrial
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Piezas precisas para trabajo exigente.
            </h1>
            <p className="max-w-xl text-muted">
              Compara rangos de precio y consulta las dimensiones disponibles antes
              de elegir una variante.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:max-w-85 lg:items-end">
            <p className="text-sm text-muted">Cargando productos...</p>
            <aside className="w-full rounded-xl bg-emerald-950 p-5 text-white dark:bg-emerald-950">
              <div className="flex items-center gap-3">
                <RiShareLine aria-hidden="true" size={18} />
                <h2 className="font-semibold">Búsqueda ampliada</h2>
              </div>
              <p className="mt-2 text-sm text-emerald-50">
                Explora todo el catálogo y encuentra coincidencias fuera de los
                filtros actuales.
              </p>
              <Button fullWidth className="mt-4" variant="primary" isDisabled>
                Buscar en catálogo completo
                <RiSearchLine aria-hidden="true" />
              </Button>
            </aside>
          </div>
        </section>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="w-full lg:flex-1">
            <TextField isDisabled name="local-search" type="text">
              <Label className="sr-only">Filtrar resultados visibles</Label>
              <Input placeholder="Buscar tornillos, tuercas, herramientas..." />
            </TextField>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full justify-between sm:w-48" variant="secondary" isDisabled>
              Filtrar categorías
            </Button>
            <Button className="w-full justify-between sm:w-48" variant="secondary" isDisabled>
              Filtrar marcas
            </Button>
          </div>
        </div>
        <p className="sr-only" role="status">
          Cargando productos...
        </p>
      </main>
    </div>
  )
}
