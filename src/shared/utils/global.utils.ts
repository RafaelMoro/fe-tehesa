/**
 * This function calls the API to save the theme in the cookie for client side components
 * @param theme - The theme mode to save
 * @returns Promise<void>
 */
export const saveThemeApi = async (theme: string) => {
  try {
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ theme }),
    })
    return res
  } catch (error) {
    console.log("error while saving theme in api", error)
  }
}

const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

export const formatNumberToCurrency = (amount: number): string =>
  formatter.format(amount)
