import { useState } from "react"
import { render, screen, userEvent } from "@__tests__/test-utils"
import { SearchInput } from "@/features/ProductListing/SearchInput"

describe("SearchInput", () => {
  it("renders the input with its Spanish label and forwards typed value to the callback", async () => {
    const onSearch = jest.fn()
    const user = userEvent.setup()

    const Wrapper = () => {
      const [value, setValue] = useState("")
      return (
        <SearchInput
          value={value}
          onSearch={(next) => {
            setValue(next)
            onSearch(next)
          }}
        />
      )
    }

    render(<Wrapper />)

    const input = screen.getByLabelText("Filtrar resultados visibles")
    expect(input).toBeInTheDocument()

    await user.type(input, "tehesa")
    expect(onSearch).toHaveBeenLastCalledWith("tehesa")
  })
})
