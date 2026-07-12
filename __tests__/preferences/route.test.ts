/**
 * @jest-environment node
 */
import { POST } from "@/app/api/preferences/route"
import {
  MSG_PRF_VAL_001_MALFORMED,
  MSG_PRF_VAL_001_MISSING,
  MSG_PRF_VAL_001_TYPE,
  MSG_PRF_VAL_001_VALUE,
  PRF_VAL_001,
} from "@/shared/constants/global.constants"

const saveThemeCookieMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  saveThemeCookie: (...args: unknown[]) => saveThemeCookieMock(...args),
}))

afterEach(() => {
  saveThemeCookieMock.mockReset()
})

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/preferences", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

const textRequest = (text: string) =>
  new Request("http://localhost/api/preferences", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: text,
  })

describe("POST /api/preferences", () => {
  it("accepts { theme: 'light' } and returns HTTP 201", async () => {
    const res = await POST(jsonRequest({ theme: "light" }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      success: true,
      themeChangedTo: "light",
    })
    expect(saveThemeCookieMock).toHaveBeenCalledWith("light")
  })

  it("accepts { theme: 'dark' } and returns HTTP 201", async () => {
    const res = await POST(jsonRequest({ theme: "dark" }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      success: true,
      themeChangedTo: "dark",
    })
    expect(saveThemeCookieMock).toHaveBeenCalledWith("dark")
  })

  it("rejects a missing theme with PRF_VAL_001 and no save call", async () => {
    const res = await POST(jsonRequest({}))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: PRF_VAL_001,
      message: MSG_PRF_VAL_001_MISSING,
    })
    expect(saveThemeCookieMock).not.toHaveBeenCalled()
  })

  it("rejects a null theme with PRF_VAL_001 and no save call", async () => {
    const res = await POST(jsonRequest({ theme: null }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: PRF_VAL_001,
      message: MSG_PRF_VAL_001_MISSING,
    })
    expect(saveThemeCookieMock).not.toHaveBeenCalled()
  })

  it("rejects a non-string theme with PRF_VAL_001 and no save call", async () => {
    const res = await POST(jsonRequest({ theme: 42 }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: PRF_VAL_001,
      message: MSG_PRF_VAL_001_TYPE,
    })
    expect(saveThemeCookieMock).not.toHaveBeenCalled()
  })

  it("rejects an unsupported theme with PRF_VAL_001 and no save call", async () => {
    const res = await POST(jsonRequest({ theme: "purple" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: PRF_VAL_001,
      message: MSG_PRF_VAL_001_VALUE,
    })
    expect(saveThemeCookieMock).not.toHaveBeenCalled()
  })

  it("rejects extra fields with PRF_VAL_001 and no save call", async () => {
    const res = await POST(jsonRequest({ theme: "light", extra: true }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: PRF_VAL_001,
      message: MSG_PRF_VAL_001_MISSING,
    })
    expect(saveThemeCookieMock).not.toHaveBeenCalled()
  })

  it("rejects malformed JSON with PRF_VAL_001 and no save call", async () => {
    const res = await POST(textRequest("{not-json"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: PRF_VAL_001,
      message: MSG_PRF_VAL_001_MALFORMED,
    })
    expect(saveThemeCookieMock).not.toHaveBeenCalled()
  })
})
