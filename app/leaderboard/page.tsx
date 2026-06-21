'use client'

import { useState, useEffect } from 'react'
import { useChainConfig } from '../hooks/useChainConfig'
import { useChainId } from 'wagmi'
import { API_URL } from '../config/chains'

type Period = 'weekly' | 'monthly' | 'season' | 'total'

type LeaderboardPlayer = {
  address: string
  totalScore: string
  weeklyScore: string
  monthlyScore: string
  seasonScore: string
  streakDays: string
  boostMultiplier: string
  achievementFlags: number
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('weekly')
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const chainId = useChainId()
  const { chainName, isSupported } = useChainConfig()

  useEffect(() => {
    if (!isSupported) return

    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?chainId=${chainId}&period=${period}`)
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard data')
        }
        const data = await res.json()
        setPlayers(data.players || [])
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [chainId, period, isSupported])

  if (!isSupported) {
    return <CenteredMessage title="Wrong network" subtitle="Please switch your wallet to a supported network (ARC Testnet, Base, or Celo)." />
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title & Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Arena Rankings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Global leaderboard for the {chainName} network.
          </p>
        </div>
        
        {/* Period tabs */}
        <div className="flex gap-1.5 bg-gray-950 border border-gray-800/80 rounded-xl p-1 w-fit shadow-inner">
          {(['weekly', 'monthly', 'season', 'total'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading arena rankings...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-8 text-center text-red-200">
          <p className="text-lg font-semibold">Error Loading Leaderboard</p>
          <p className="text-sm text-red-400/80 mt-1">{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto backdrop-blur-sm">
          <p className="text-5xl">🏆</p>
          <h3 className="text-lg font-bold text-white">No Rankings Yet</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Be the first to claim your spot! Complete today's quiz on {chainName} to start earning points.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950/40 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Player Address</th>
                  <th className="py-4 px-6 text-center">Streak</th>
                  <th className="py-4 px-6 text-center">Boost</th>
                  <th className="py-4 px-6 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {players.map((player, idx) => {
                  const isTop3 = idx < 3
                  const rankStyles = 
                    idx === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    idx === 1 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/30' :
                    idx === 2 ? 'bg-amber-700/10 text-amber-600 border border-amber-700/30' :
                    'text-gray-400'

                  const scoreValue = player[`${period}Score`] || '0'

                  return (
                    <tr 
                      key={player.address} 
                      className={`transition-colors duration-150 hover:bg-gray-900/20 ${
                        idx === 0 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-6 text-center font-bold">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankStyles}`}>
                          {idx + 1}
                        </span>
                      </td>
                      
                      {/* Player Column */}
                      <td className="py-4 px-6 font-mono text-sm text-gray-200">
                        {formatAddress(player.address)}
                      </td>
                      
                      {/* Streak Column */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-950/30 text-pink-400 border border-pink-900/30">
                          🔥 {player.streakDays || '0'}
                        </span>
                      </td>

                      {/* Boost Column */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950/30 text-purple-400 border border-purple-900/30">
                          {(Number(player.boostMultiplier || '100') / 100).toFixed(2)}x
                        </span>
                      </td>
                      
                      {/* Score Column */}
                      <td className="py-4 px-6 text-right font-extrabold text-white text-base">
                        {scoreValue}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function CenteredMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-3 pt-24 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-gray-400 text-sm leading-relaxed">{subtitle}</p>
    </div>
  )
}
