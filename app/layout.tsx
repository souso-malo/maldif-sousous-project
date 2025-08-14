import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gestionnaire de Coffre-Fort',
  description: 'Application de gestion de coffre-fort pour commandes clients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}