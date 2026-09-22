import Link from "next/link"

import { CategoryCard } from "./CategoryCard"
import { WhatsappPanel } from "@/shared/ui/organisms/WhatsappPanel"
import type { CategoryWithCount } from "@/shared/types/global.types"

export const CategoriesPage = ({ categories }: { categories: CategoryWithCount[] }) => {
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
            Tornillería, brocas, herramienta de corte, llaves y equipo de seguridad.{" "}
            {categories.length} categorías con existencia en Puebla. Cotiza por
            WhatsApp.
          </p>
        </div>
        <WhatsappPanel />
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
