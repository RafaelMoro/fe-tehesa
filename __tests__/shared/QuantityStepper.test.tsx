import { useState } from "react"

import { render, screen, userEvent } from "@__tests__/test-utils"
import { QuantityStepper } from "@/shared/ui/atoms/QuantityStepper"

const ControlledStepper = ({
  initialValue = 1,
  minValue,
  maxValue,
}: {
  initialValue?: number
  minValue?: number
  maxValue?: number
}) => {
  const [value, setValue] = useState(initialValue)
  return (
    <QuantityStepper
      label="Cantidad de 1/4 in"
      value={value}
      onChange={setValue}
      minValue={minValue}
      maxValue={maxValue}
    />
  )
}

describe("QuantityStepper", () => {
  it("increments the value when the increment button is pressed", async () => {
    const user = userEvent.setup()
    render(<ControlledStepper />)

    await user.click(
      screen.getByRole("button", { name: "Aumentar Cantidad de 1/4 in" }),
    )

    expect(screen.getByDisplayValue("2")).toBeInTheDocument()
  })

  it("decrements the value when the decrement button is pressed", async () => {
    const user = userEvent.setup()
    render(<ControlledStepper initialValue={2} />)

    await user.click(
      screen.getByRole("button", { name: "Disminuir Cantidad de 1/4 in" }),
    )

    expect(screen.getByDisplayValue("1")).toBeInTheDocument()
  })

  it("does not go below minValue", async () => {
    const user = userEvent.setup()
    render(<ControlledStepper initialValue={1} minValue={1} />)

    await user.click(
      screen.getByRole("button", { name: "Disminuir Cantidad de 1/4 in" }),
    )

    expect(screen.getByDisplayValue("1")).toBeInTheDocument()
  })

  it("does not exceed maxValue", async () => {
    const user = userEvent.setup()
    render(<ControlledStepper initialValue={100} maxValue={100} />)

    await user.click(
      screen.getByRole("button", { name: "Aumentar Cantidad de 1/4 in" }),
    )

    expect(screen.getByDisplayValue("100")).toBeInTheDocument()
  })

  it("does not call onChange with NaN when the input is cleared", async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<QuantityStepper label="Cantidad de 1/4 in" value={3} onChange={onChange} />)

    const input = screen.getByRole("textbox", { name: "Cantidad de 1/4 in" })
    await user.clear(input)

    expect(onChange).not.toHaveBeenCalledWith(NaN)
  })
})
