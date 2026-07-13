"use client"

import { Button } from "@heroui/react"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="p-10 flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-bold">No pudimos cargar el catálogo.</h1>
      <p>No se pudo recuperar la información de productos. Inténtalo de nuevo.</p>
      <Button onPress={reset}>Reintentar</Button>
    </main>
  )
}
