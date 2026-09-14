interface CatalogPageLayoutProps {
  children: React.ReactNode
}

export const CatalogPageLayout = ({ children }: CatalogPageLayoutProps) => (
  <div>
    <main className="flex flex-col gap-7 p-4 sm:p-6">{children}</main>
  </div>
)
