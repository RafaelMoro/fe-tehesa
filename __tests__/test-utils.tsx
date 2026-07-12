import { render, type RenderOptions } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { Providers } from "@/app/providers"

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: Providers, ...options })

export * from "@testing-library/react"
export { customRender as render, userEvent }
