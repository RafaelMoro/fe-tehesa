import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-5">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="text-muted">La página que buscas no existe o fue movida.</p>
      <Link href="/categorias" className="text-primary underline">
        Ver todas las categorías
      </Link>
    </main>
  )
}
