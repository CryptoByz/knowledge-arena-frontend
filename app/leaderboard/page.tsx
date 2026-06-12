'use client'

import { useState } from 'react'
import { useChainConfig } from '../hooks/useChainConfig'

type Period = 'weekly' | 'monthly' | 'season'

// Leaderboard verileri contract'tan event'ler veya subgraph ile çekilebilir.
// MVP için şimdilik placeholder - ileride The Graph veya event indexer eklenecek.
export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('weekly')
  const { chainName, isSupported } = useChainConfig()

  if (!isSupported) {
    return <CenteredMessage title="Wrong network" subtitle="Switch to ARC Testnet or Base Sepolia." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <span className="text-sm text-gray-400">{chainName}</span>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(['weekly', 'monthly', 'season'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Coming soon */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center space-y-3">
        <p className="text-4xl">🏆</p>
        <p className="text-lg font-semibold">Leaderboard coming soon</p>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Rankings are being indexed from onchain events. This will populate as players complete daily quizzes.
        </p>
      </div>
    </div>
  )
}

function CenteredMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-3 pt-24">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  )
}
