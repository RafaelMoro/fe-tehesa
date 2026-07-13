import { Header } from "@/shared/ui/organisms/Header"

interface CatalogPageLayoutProps {
  themeFetched: string
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
