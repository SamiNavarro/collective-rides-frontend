import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/contexts/auth-context"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ThemeProvider } from "next-themes"

export const metadata: Metadata = {
  title: "Collective Rides",
  description:
    "Your Sydney cycling adventure starts here. Discover the best routes, coffee stops, and cycling communities across Sydney.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
