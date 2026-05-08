import { useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Button } from "@heroui/react"
import { Product } from "@/shared/types/global.types";
import { fetchProduct } from "@/shared/lib/global.lib";

interface ProductVariantsDrawerProps {
  product: Product
  isOpen: boolean
  onOpenChange: () => void
}

export const ProductVariantsDrawer = ({ product, isOpen, onOpenChange }: ProductVariantsDrawerProps) => {
  useEffect(() => {
    const loadProductData = async () => {
      const data = await fetchProduct({ documentId: product.documentId });
      console.log('data', data);
    };
    
    if (isOpen) {
      loadProductData();
    }
  }, [isOpen, product.documentId]);

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