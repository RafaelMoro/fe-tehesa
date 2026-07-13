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
  <div>
    <Header themeFetched={themeFetched} />
    <main className="flex flex-col gap-7 p-4 sm:p-6">{children}</main>
  </div>
)
