import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Button, useDisclosure } from "@heroui/react"
import { Product } from "@/shared/types/global.types";

interface ProductVariantsDrawerProps {
  product: Product
  isOpen: boolean
  onOpenChange: () => void
}

export const ProductVariantsDrawer = ({ product, isOpen, onOpenChange }: ProductVariantsDrawerProps) => {
  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">{product.name}</DrawerHeader>
            <DrawerBody>
              <p>Variants</p>
            </DrawerBody>
            <DrawerFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Action
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}