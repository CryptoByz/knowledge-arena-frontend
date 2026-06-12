'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useChainConfig } from '../../hooks/useChainConfig'

export function Navbar() {
  const { isSupported, chainName } = useChainConfig()

  return (
    <nav className="border-b border-gray-800 bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Knowledge</span>
          <span className="text-xl font-bold text-indigo-400">Arena</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/quiz" className="hover:text-white transition-colors">Play</Link>
          <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/achievements" className="hover:text-white transition-colors">Achievements</Link>
          <Link href="/rewards" className="hover:text-white transition-colors">Rewards</Link>
        </div>

        {/* Chain badge + wallet */}
        <div className="flex items-center gap-3">
          {isSupported ? (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700">
              {chainName}
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-red-900 text-red-300 border border-red-700">
              Wrong Network
            </span>
          )}
          <ConnectButton showBalance={false} chainStatus="none" />
        </div>

      </div>
    </nav>
  )
}
