import { Home } from "@/features/Home/Home";
import { Header } from "@/shared/ui/organisms/Header";
import { fetchProducts, getThemePreference } from "@/shared/lib/global.lib";

export default async function MainPage() {
  const [products, themeFetched] = await Promise.all([
    fetchProducts(),
    getThemePreference()
  ])

  return (
    <div>
      <Header themeFetched={themeFetched} />
      <main className="p-10">
        <h1 className="text-4xl font-bold text-center mb-5">Catalogo de productos</h1>
        <Home products={products} />
      </main>
    </div>
  );
}
