import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Button, CheckboxGroup, Checkbox } from "@heroui/react"

import { Product, ProductVariantUI } from "@/shared/types/global.types";
import { fetchProductVariants } from "@/shared/lib/global.lib";
import { formatNumberToCurrency } from "@/shared/utils/global.utils";

interface ProductVariantsDrawerProps {
  product: Product
  isOpen: boolean
  onOpenChange: () => void
}

export const ProductVariantsDrawer = ({ product, isOpen, onOpenChange }: ProductVariantsDrawerProps) => {
  const [variants, setVariants] = useState<ProductVariantUI[]>([]);

  useEffect(() => {
    const loadProductData = async () => {
      const data = await fetchProductVariants({ documentId: product.documentId });
      const formattedData = data.map(variant => ({
        diameter: variant.diameter,
        price: variant.pricing.price,
        priceFormatted: formatNumberToCurrency(variant.pricing.price),
      })).sort((a, b) => a.price - b.price);
      setVariants(formattedData);
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
              { variants.length > 0 && (
                <CheckboxGroup label="Seleccione una o varias variantes">
                  {variants.map((variant, index) => (
                    <Checkbox key={index} value={variant.diameter}>
                      {variant.diameter} - {variant.priceFormatted}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              )}
            </DrawerBody>
            <DrawerFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" onPress={onClose}>
                Finalizar
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}