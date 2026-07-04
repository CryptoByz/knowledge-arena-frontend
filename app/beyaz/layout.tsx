import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CNC Torna G-Code Üretici',
  description: 'Teknik resimden CNC torna G-code otomatik üretimi',
  robots: 'noindex, nofollow',
}

// Bu layout ana site layout'undan tamamen bağımsız —
// Navbar, Web3Provider ve global CSS yüklenmez.
export default function BeyazLayout({ children }: { children: React.ReactNode }) {
  return children
}
