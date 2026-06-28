'use client'

import { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { API_URL, SUPPORTED_CHAINS } from '../config/chains'

type Period = 'weekly' | 'monthly'
type Mode = 'daily' | 'challenges'

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

type Challenge = {
  id: string
  title: string
  description: string
  chainId: number
  questionsCount?: number
  rewardPool: string
  startTimestamp: number
  endTimestamp: number
  isActive: boolean
}

type ChallengePlayer = {
  address: string
  score: string
  totalQuestions?: string
  durationSeconds?: number
  timestamp: string
}

export default function LeaderboardPage() {
  const walletChainId = useChainId()
  const [mode, setMode] = useState<Mode>('daily')

  // Daily Leaderboard States
  const [selectedChainId, setSelectedChainId] = useState<number>(8453)
  const [period, setPeriod] = useState<Period>('weekly')
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Challenge Leaderboard States
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('')
  const [challengePlayers, setChallengePlayers] = useState<ChallengePlayer[]>([])
  const [loadingChallenge, setLoadingChallenge] = useState(false)

  // Automatically sync selected chain if connected wallet chain is supported
  useEffect(() => {
    const supportedIds: number[] = SUPPORTED_CHAINS.map((c) => c.id)
    if (supportedIds.includes(walletChainId)) {
      setSelectedChainId(walletChainId)
    }
  }, [walletChainId])

  // Fetch daily leaderboard data
  useEffect(() => {
    if (mode !== 'daily') return
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)
      setCurrentPage(1)
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?chainId=${selectedChainId}&period=${period}`)
        if (!res.ok) throw new Error('Failed to fetch leaderboard data')
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
  }, [selectedChainId, period, mode])

  // Fetch challenge list when switching to challenges mode
  useEffect(() => {
    if (mode !== 'challenges') return
    async function fetchChallengesList() {
      setLoadingChallenge(true)
      try {
        const res = await fetch(`${API_URL}/api/challenges`)
        if (res.ok) {
          const data: Challenge[] = await res.json()
          setChallenges(data)
          if (data.length > 0 && !selectedChallengeId) {
            setSelectedChallengeId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching challenges:', err)
      } finally {
        setLoadingChallenge(false)
      }
    }
    fetchChallengesList()
  }, [mode])

  // Fetch leaderboard for selected challenge
  useEffect(() => {
    if (mode !== 'challenges' || !selectedChallengeId) return
    async function fetchChallengeRankings() {
      setLoadingChallenge(true)
      try {
        const res = await fetch(`${API_URL}/api/challenges/${selectedChallengeId}/leaderboard`)
        if (res.ok) {
          const data = await res.json()
          setChallengePlayers(data.players || [])
        }
      } catch (err) {
        console.error('Error fetching challenge leaderboard:', err)
      } finally {
        setLoadingChallenge(false)
      }
    }
    fetchChallengeRankings()
  }, [selectedChallengeId, mode])

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  const formatDuration = (secs?: number) => {
    if (!secs || secs <= 0) return 'N/A'
    if (secs < 60) return `${secs} saniye`
    const mins = Math.floor(secs / 60)
    const remSecs = secs % 60
    return `${mins}dk ${remSecs}s`
  }

  const getNetworkStyle = (chainId: number, isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-950/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-900/60'
    }
    switch (chainId) {
      case 5042002: return 'bg-indigo-600/20 border-indigo-500/80 text-indigo-300 shadow-md shadow-indigo-500/10'
      case 8453: return 'bg-blue-600/20 border-blue-500/80 text-blue-300 shadow-md shadow-blue-500/10'
      case 42220: return 'bg-amber-600/20 border-amber-500/80 text-amber-300 shadow-md shadow-amber-500/10'
      default: return 'bg-indigo-600 border-indigo-500 text-white shadow-md'
    }
  }

  // Daily Pagination Logic
  const itemsPerPage = 50
  const totalPages = Math.ceil(players.length / itemsPerPage)
  const paginatedPlayers = players.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Title & Info */}
      <div className="border-b border-gray-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Arena Rankings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Sıralamaları inceleyin, liderlik tablosundaki yerinizi alın.
          </p>
        </div>

        {/* MODE SELECTOR (Daily vs Special Challenges) */}
        <div className="flex bg-gray-950 border border-gray-800 rounded-2xl p-1 shadow-inner">
          <button
            onClick={() => setMode('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              mode === 'daily' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 Günlük Arenalar
          </button>
          <button
            onClick={() => setMode('challenges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              mode === 'challenges' ? 'bg-amber-500 text-gray-950 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Özel Quizler
          </button>
        </div>
      </div>

      {/* ================= MODE 1: DAILY ARENA LEADERBOARDS ================= */}
      {mode === 'daily' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            <div className="flex gap-1.5 bg-gray-950 border border-gray-800/80 rounded-xl p-1 w-fit shadow-inner">
              {(['weekly', 'monthly'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
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
              <p className="text-sm text-gray-400">Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-8 text-center text-red-200">
              <p className="text-lg font-semibold">Hata Oluştu</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          ) : players.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto backdrop-blur-sm">
              <p className="text-5xl">🏆</p>
              <h3 className="text-lg font-bold text-white">Henüz Sıralama Yok</h3>
              <p className="text-gray-400 text-sm leading-relaxed">İlk puanı kazanan siz olun!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950/40 backdrop-blur-md shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                        <th className="py-4 px-6 text-center w-16">Sıra</th>
                        <th className="py-4 px-6">Oyuncu Adresi</th>
                        <th className="py-4 px-6 text-center">Seri (Streak)</th>
                        <th className="py-4 px-6 text-center">Boost</th>
                        <th className="py-4 px-6 text-right">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {paginatedPlayers.map((player, idx) => {
                        const globalRank = (currentPage - 1) * itemsPerPage + idx + 1
                        const rankStyles =
                          globalRank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          globalRank === 2 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/30' :
                          globalRank === 3 ? 'bg-amber-700/10 text-amber-600 border border-amber-700/30' :
                          'text-gray-400'

                        return (
                          <tr key={player.address} className="transition-colors duration-150 hover:bg-gray-900/20">
                            <td className="py-4 px-6 text-center font-bold">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankStyles}`}>
                                {globalRank}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-sm text-gray-200">
                              {formatAddress(player.address)}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-950/30 text-pink-400 border border-pink-900/30">
                                🔥 {player.streakDays || '0'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950/30 text-purple-400 border border-purple-900/30">
                                {(Number(player.boostMultiplier || '100') / 100).toFixed(2)}x
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-white text-base">
                              {player[`${period}Score`] || '0'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODE 2: SPECIAL CHALLENGE LEADERBOARDS ================= */}
      {mode === 'challenges' && (
        <div className="space-y-6">
          
          {/* Challenge Selector */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                  Özel Quiz Seçimi
                </label>
                <select
                  value={selectedChallengeId}
                  onChange={(e) => setSelectedChallengeId(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-amber-500 w-full sm:w-80"
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.isActive ? '⚡ [AKTİF] ' : '🔒 [PASİF] '} {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedChallenge && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedChallenge.isActive 
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80 animate-pulse' 
                      : 'bg-gray-950 text-gray-500 border-gray-800'
                  }`}>
                    {selectedChallenge.isActive ? '⚡ Etkinlik Aktif' : '🔒 Etkinlik Tamamlandı'}
                  </span>

                  {selectedChallenge.rewardPool && (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                      🏆 {selectedChallenge.rewardPool}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tie breaking note */}
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-xs text-amber-300/90 flex items-start gap-2">
              <span>ℹ️</span>
              <div>
                <strong>Ödül Dağıtımı & Eşitlik Kuralı:</strong> Sıralama öncelikle <span className="underline font-bold">En Yüksek Doğru Sayısı</span>, eşitlik halinde ise <span className="underline font-bold">En Hızlı Tamamlama Süresi</span> (saniye) baz alınarak filtrelenmektedir.
              </div>
            </div>
          </div>

          {/* Rankings Table for Challenge */}
          {loadingChallenge ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Özel yarışma sıralaması yükleniyor...</p>
            </div>
          ) : challengePlayers.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto backdrop-blur-sm">
              <p className="text-5xl">🎯</p>
              <h3 className="text-lg font-bold text-white">Henüz Katılımcı Yok</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Bu özel yarışmaya katılan ilk kişi olun ve ödül sıralamasına girin!</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950/40 backdrop-blur-md shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                      <th className="py-4 px-6 text-center w-16">Sıra</th>
                      <th className="py-4 px-6">Oyuncu Cüzdanı</th>
                      <th className="py-4 px-6 text-center">Doğru Sayısı / Skor</th>
                      <th className="py-4 px-6 text-center">Tamamlama Süresi</th>
                      <th className="py-4 px-6 text-right">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {challengePlayers.map((player, idx) => {
                      const rank = idx + 1
                      const rankStyles =
                        rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black' :
                        rank === 2 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40 font-bold' :
                        rank === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40 font-bold' :
                        'text-gray-400 font-medium'

                      const qTotal = player.totalQuestions || selectedChallenge?.questionsCount || '?'

                      return (
                        <tr key={player.address} className={`transition-colors duration-150 ${rank === 1 ? 'bg-amber-500/5' : 'hover:bg-gray-900/20'}`}>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankStyles}`}>
                              {rank}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-mono text-sm text-gray-200">
                            {formatAddress(player.address)}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60">
                              ✅ {player.score} / {qTotal} Doğru
                            </span>
                          </td>

                          <td className="py-4 px-6 text-center font-mono text-xs">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 text-amber-300 border border-amber-900/60 font-bold">
                              ⚡ {formatDuration(player.durationSeconds)}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right font-mono text-xs text-gray-500">
                            {player.timestamp ? new Date(Number(player.timestamp) * 1000).toLocaleDateString() : '-'}
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
      )}

    </div>
  )
}
