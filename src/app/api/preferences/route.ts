import { saveThemeCookie } from "@/shared/lib/global.lib"
import { ErrorCatched } from "@/shared/types/global.types"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const theme = payload?.theme
    if (!theme) {
      return NextResponse.json({ message: 'Theme is required' }, { status: 400 })
    }

    await saveThemeCookie(theme)
    return NextResponse.json({ success: true, themeChangedTo: theme }, { status: 201 })
  } catch (error: unknown) {
    const currentError = error as ErrorCatched
    return NextResponse.json({ message: currentError?.message }, { status: 400 })
  }
}