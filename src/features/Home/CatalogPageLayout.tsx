import { Header } from "@/shared/ui/organisms/Header"
import type { AppTheme } from "@/shared/types/global.types"

interface CatalogPageLayoutProps {
  themeFetched: AppTheme
  children: React.ReactNode
}

export const CatalogPageLayout = ({
  themeFetched,
  children,
}: CatalogPageLayoutProps) => (
  <div className="min-h-screen">
    <Header themeFetched={themeFetched} />
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-4 sm:p-6">
      {children}
    </main>
  </div>
)
