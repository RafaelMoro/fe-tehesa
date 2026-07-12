import { Home } from "@/features/Home/Home"
import { Header } from "@/shared/ui/organisms/Header"
import { fetchProducts, getThemePreference } from "@/shared/lib/global.lib"
import { ChangeThemeStoreProvider } from "@/zustand/provider/change-theme.provider"

export default async function MainPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams

  // Parse and validate page parameter
  const pageParam = params.page || "1"
  const currentPage = Math.max(1, Math.min(5, parseInt(pageParam, 10) || 1))

  const [products, themeFetched] = await Promise.all([
    fetchProducts(currentPage),
    getThemePreference(),
  ])

  // Calculate pagination props
  const totalPages = 5 // Known constraint: 5 pages maximum

  return (
    <ChangeThemeStoreProvider>
      <div>
        <Header themeFetched={themeFetched} />
        <main className="p-10 flex flex-col gap-10">
          <h1 className="text-4xl font-bold text-center mb-5">
            Catalogo de productos
          </h1>
          <Home
            products={products}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </main>
      </div>
    </ChangeThemeStoreProvider>
  )
}
