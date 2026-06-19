import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from './config/Web3Provider'
import { Navbar } from './components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Knowledge Arena',
  description: 'The onchain knowledge game platform for Web3 and AI',
  other: {
    'talentapp:project_verification': 'd7043c79ce40b4685beb5a79297308ceb6b3adadd645c14c6ae80f195107bbf11deef01b74ab87b3459aadc5690f1be65cbef7f046aa600fa26f657817b1d2ba',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Web3Provider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  )
}
