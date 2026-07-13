import { Card, Skeleton } from "@heroui/react"

export const ProductCardSkeleton = () => (
  <Card className="h-full gap-0 overflow-hidden">
    <Card.Header className="flex flex-col gap-3 px-5 pt-5 pb-4">
      <Skeleton className="h-3 w-2/5 rounded" />
      <Skeleton className="h-7 w-4/5 rounded" />
      <Skeleton className="h-4 w-1/3 rounded" />
    </Card.Header>
    <Card.Content className="border-t border-default-200 px-5 py-4">
      <div className="grid grid-cols-2 divide-x divide-default-200">
        <div className="flex flex-col gap-2 pr-4">
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-6 w-4/5 rounded" />
        </div>
        <div className="flex flex-col gap-2 pl-4">
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-6 w-4/5 rounded" />
        </div>
      </div>
    </Card.Content>
    <Card.Footer className="flex gap-3">
      <Skeleton className="h-10 flex-1 rounded" />
      <Skeleton className="h-10 flex-1 rounded" />
    </Card.Footer>
  </Card>
)
