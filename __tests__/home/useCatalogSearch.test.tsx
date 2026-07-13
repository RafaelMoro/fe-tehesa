/**
 * @jest-environment jsdom
 */
import { useEffect } from "react"
import { act, render } from "@__tests__/test-utils"
import { useCatalogSearch } from "@/features/Home/useCatalogSearch"

const Harness = ({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useCatalogSearch>) => void
}) => {
  const api = useCatalogSearch()
  useEffect(() => {
    onReady(api)
  })
  return (
    <div>
      <span data-testid="term">{api.catalogSearchTerm}</span>
      <span data-testid="message">{api.catalogMessage ?? ""}</span>
      <span data-testid="kind">{api.catalogMessageKind ?? "null"}</span>
      <span data-testid="invalid">{String(api.isInvalidCatalogSearch)}</span>
      <span data-testid="invalid-msg">{api.invalidSearchMessage ?? ""}</span>
      <span data-testid="drawer-open">
        {String(api.catalogSearchDrawerState.isOpen)}
      </span>
    </div>
  )
}

let harnessApi: ReturnType<typeof useCatalogSearch> | null = null
const captureApi = (api: ReturnType<typeof useCatalogSearch>) => {
  harnessApi = api
}

beforeEach(() => {
  harnessApi = null
})

const mount = () => {
  render(<Harness onReady={captureApi} />)
  return getApi()
}

const getApi = () => harnessApi!

describe("useCatalogSearch", () => {
  it("sets the specific invalid message on whitespace-only submit", () => {
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("   ")
    })

    let result: string | null = "unexpected"
    act(() => {
      result = getApi().validateCatalogSearchTerm()
    })

    expect(result).toBeNull()
    expect(getApi().isInvalidCatalogSearch).toBe(true)
    expect(getApi().invalidSearchMessage).toBe(
      "Ingresa un texto para buscar en el catálogo.",
    )
  })

  it("trims and returns a valid term", () => {
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("  Tire  ")
    })

    let result: string | null = null
    act(() => {
      result = getApi().validateCatalogSearchTerm()
    })

    expect(result).toBe("Tire")
    expect(getApi().isInvalidCatalogSearch).toBe(false)
  })

  it("clears invalid state when the term is edited", () => {
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("   ")
      api.validateCatalogSearchTerm()
    })
    expect(getApi().isInvalidCatalogSearch).toBe(true)

    act(() => {
      getApi().handleCatalogSearchTermChange("a")
    })
    expect(getApi().isInvalidCatalogSearch).toBe(false)
  })

  it("clear helpers reset input state and close the drawer", () => {
    const api = mount()

    act(() => {
      api.catalogSearchDrawerState.open()
      api.handleCatalogSearchTermChange("Tire")
    })
    expect(getApi().catalogSearchDrawerState.isOpen).toBe(true)

    act(() => {
      getApi().clearCatalogSearchInput()
    })
    expect(getApi().catalogSearchTerm).toBe("")
    expect(getApi().catalogSearchDrawerState.isOpen).toBe(false)

    act(() => {
      getApi().catalogSearchDrawerState.open()
      getApi().handleCatalogSearchTermChange("Brake")
      getApi().clearAllCatalogState()
    })
    expect(getApi().catalogSearchTerm).toBe("")
    expect(getApi().catalogSearchDrawerState.isOpen).toBe(false)
  })
})
