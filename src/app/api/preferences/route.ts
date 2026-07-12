import { NextResponse } from "next/server"
import { saveThemeCookie } from "@/shared/lib/global.lib"
import {
  isAppTheme,
  MSG_PRF_VAL_001_MALFORMED,
  MSG_PRF_VAL_001_MISSING,
  MSG_PRF_VAL_001_TYPE,
  MSG_PRF_VAL_001_VALUE,
  PRF_VAL_001,
} from "@/shared/constants/global.constants"

type PreferenceBody = { theme: unknown }

const isPreferenceBody = (value: unknown): value is PreferenceBody =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, code: PRF_VAL_001, message: MSG_PRF_VAL_001_MALFORMED },
      { status: 400 },
    )
  }

  if (!isPreferenceBody(body)) {
    return NextResponse.json(
      { success: false, code: PRF_VAL_001, message: MSG_PRF_VAL_001_MALFORMED },
      { status: 400 },
    )
  }

  if (Object.keys(body).length !== 1 || !("theme" in body)) {
    return NextResponse.json(
      { success: false, code: PRF_VAL_001, message: MSG_PRF_VAL_001_MISSING },
      { status: 400 },
    )
  }

  const { theme } = body
  if (theme === undefined || theme === null) {
    return NextResponse.json(
      { success: false, code: PRF_VAL_001, message: MSG_PRF_VAL_001_MISSING },
      { status: 400 },
    )
  }
  if (typeof theme !== "string") {
    return NextResponse.json(
      { success: false, code: PRF_VAL_001, message: MSG_PRF_VAL_001_TYPE },
      { status: 400 },
    )
  }
  if (!isAppTheme(theme)) {
    return NextResponse.json(
      { success: false, code: PRF_VAL_001, message: MSG_PRF_VAL_001_VALUE },
      { status: 400 },
    )
  }

  await saveThemeCookie(theme)
  return NextResponse.json(
    { success: true, themeChangedTo: theme },
    { status: 201 },
  )
}
