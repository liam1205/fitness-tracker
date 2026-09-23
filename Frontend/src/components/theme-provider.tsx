import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/** Wraps next-themes with this app's defaults: class-based, defaults to system. */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
