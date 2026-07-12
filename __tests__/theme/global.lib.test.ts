/**
 * @jest-environment node
 */
import { getThemePreference, saveThemeCookie } from "@/shared/lib/global.lib"

const getMock = jest.fn()
const setMock = jest.fn()

jest.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (...args: unknown[]) => getMock(...args),
      set: (...args: unknown[]) => setMock(...args),
    }),
}))

afterEach(() => {
  getMock.mockReset()
  setMock.mockReset()
})

describe("getThemePreference", () => {
  it("returns light when no cookie is set", async () => {
    getMock.mockReturnValue(undefined)
    await expect(getThemePreference()).resolves.toBe("light")
  })

  it("returns light when the persisted cookie is empty", async () => {
    getMock.mockReturnValue({ value: "" })
    await expect(getThemePreference()).resolves.toBe("light")
  })

  it("returns light when the persisted cookie holds an unsupported value", async () => {
    getMock.mockReturnValue({ value: "purple" })
    await expect(getThemePreference()).resolves.toBe("light")
  })

  it("passes through a valid light cookie", async () => {
    getMock.mockReturnValue({ value: "light" })
    await expect(getThemePreference()).resolves.toBe("light")
  })

  it("passes through a valid dark cookie", async () => {
    getMock.mockReturnValue({ value: "dark" })
    await expect(getThemePreference()).resolves.toBe("dark")
  })
})

describe("saveThemeCookie", () => {
  it("writes a valid light cookie with the exact secure options", async () => {
    await saveThemeCookie("light")
    expect(setMock).toHaveBeenCalledWith("tehesa-theme", "light", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    })
  })

  it("writes a valid dark cookie with the exact secure options", async () => {
    await saveThemeCookie("dark")
    expect(setMock).toHaveBeenCalledWith("tehesa-theme", "dark", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    })
  })

  it("does not call set when the value is not a valid AppTheme", async () => {
    // ponytail: cast through unknown to test the runtime guard with an invalid value
    await saveThemeCookie("purple" as unknown as "light")
    expect(setMock).not.toHaveBeenCalled()
  })
})
