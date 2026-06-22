'use client'

import { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { API_URL, SUPPORTED_CHAINS } from '../config/chains'

type Period = 'weekly' | 'monthly'

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
  const walletChainId = useChainId()
  const [selectedChainId, setSelectedChainId] = useState<number>(8453) // Default to Base Mainnet
  const [period, setPeriod] = useState<Period>('weekly')
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Automatically sync selected chain if connected wallet chain is supported
  useEffect(() => {
    const supportedIds: number[] = SUPPORTED_CHAINS.map((c) => c.id)
    if (supportedIds.includes(walletChainId)) {
      setSelectedChainId(walletChainId)
    }
  }, [walletChainId])

  // Fetch leaderboard data when selected chain or period changes
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)
      setCurrentPage(1) // Reset to page 1 on search change
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?chainId=${selectedChainId}&period=${period}`)
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
  }, [selectedChainId, period])

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  // Get active style colors for network selector buttons
  const getNetworkStyle = (chainId: number, isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-950/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-900/60'
    }
    switch (chainId) {
      case 5042002: // ARC
        return 'bg-indigo-600/20 border-indigo-500/80 text-indigo-300 shadow-md shadow-indigo-500/10'
      case 8453: // Base
        return 'bg-blue-600/20 border-blue-500/80 text-blue-300 shadow-md shadow-blue-500/10'
      case 42220: // Celo
        return 'bg-amber-600/20 border-amber-500/80 text-amber-300 shadow-md shadow-amber-500/10'
      default:
        return 'bg-indigo-600 border-indigo-500 text-white shadow-md'
    }
  }

  // Pagination Logic
  const itemsPerPage = 50
  const totalPages = Math.ceil(players.length / itemsPerPage)
  const paginatedPlayers = players.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title & Info */}
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Arena Rankings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Compare rankings across networks and track top trivia champions.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Network Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_CHAINS.map((c) => {
            const isActive = selectedChainId === c.id
            return (
              <button
                key={c.id}
                onClick={() => setSelectedChainId(c.id)}
                className={`px-4 py-2 border rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${getNetworkStyle(
                  c.id,
                  isActive
                )}`}
              >
                {c.name}
              </button>
            )
          })}
        </div>

        {/* Period Selector Tabs */}
        <div className="flex gap-1.5 bg-gray-950 border border-gray-800/80 rounded-xl p-1 w-fit shadow-inner">
          {(['weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
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
          <p className="text-sm text-gray-400">Loading rankings...</p>
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
            Be the first to claim your spot! Complete quizzes to start earning points.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rankings Table */}
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
                  {paginatedPlayers.map((player, idx) => {
                    const globalRank = (currentPage - 1) * itemsPerPage + idx + 1
                    const isTop3 = globalRank <= 3
                    const rankStyles =
                      globalRank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      globalRank === 2 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/30' :
                      globalRank === 3 ? 'bg-amber-700/10 text-amber-600 border border-amber-700/30' :
                      'text-gray-400'

                    const scoreValue = player[`${period}Score`] || '0'

                    return (
                      <tr
                        key={player.address}
                        className={`transition-colors duration-150 hover:bg-gray-900/20 ${
                          globalRank === 1 ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="py-4 px-6 text-center font-bold">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankStyles}`}>
                            {globalRank}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-950 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer select-none transition-colors"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-950 border border-gray-850 text-gray-400 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-950 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer select-none transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
