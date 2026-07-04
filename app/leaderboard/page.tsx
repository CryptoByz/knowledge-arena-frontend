'use client'

import { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { API_URL, SUPPORTED_CHAINS } from '../config/chains'
import { useLanguage } from '../context/LanguageContext'
import { getTranslation } from '../config/translations'
import translatedChallenges from '../config/translatedChallenges.json'

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
  const { language } = useLanguage()
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

  // Fetch challenge list (ONLY ACTIVE CHALLENGES) when switching to challenges mode
  useEffect(() => {
    if (mode !== 'challenges') return
    async function fetchChallengesList() {
      setLoadingChallenge(true)
      try {
        const res = await fetch(`${API_URL}/api/challenges`)
        if (res.ok) {
          const data: Challenge[] = await res.json()
          // Filter ONLY active challenges
          const activeOnly = data.filter(c => c.isActive)
          setChallenges(activeOnly)
          if (activeOnly.length > 0 && (!selectedChallengeId || !activeOnly.some(c => c.id === selectedChallengeId))) {
            setSelectedChallengeId(activeOnly[0].id)
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
    if (!secs || secs <= 0) return '-'
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    const remSecs = secs % 60
    return `${mins}m ${remSecs}s`
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
            {getTranslation('leaderboard', language)}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'tr'
              ? 'Ağlar arasındaki sıralamaları karşılaştırın ve lider oyuncuları takip edin.'
              : 'Compare rankings across networks and track top trivia champions.'}
          </p>
        </div>

        {/* MODE SELECTOR (Daily vs Special Challenges) */}
        <div className="flex bg-gray-950 border border-gray-800/80 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setMode('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              mode === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 {language === 'tr' ? 'Günlük Arenalar' : 'Daily Arenas'}
          </button>
          <button
            onClick={() => setMode('challenges')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              mode === 'challenges' ? 'bg-amber-500 text-gray-950 shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ {language === 'tr' ? 'Özel Quizler' : 'Special Quizzes'}
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
                  {language === 'tr' ? (p === 'weekly' ? 'Haftalık' : 'Aylık') : p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">
                {language === 'tr' ? 'Sıralamalar yükleniyor...' : 'Loading rankings...'}
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-8 text-center text-red-200">
              <p className="text-lg font-semibold">
                {language === 'tr' ? 'Liderlik Tablosu Yüklenirken Hata Oluştu' : 'Error Loading Leaderboard'}
              </p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          ) : players.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto backdrop-blur-sm">
              <p className="text-5xl">🏆</p>
              <h3 className="text-lg font-bold text-white">
                {language === 'tr' ? 'Henüz Sıralama Yok' : 'No Rankings Yet'}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {language === 'tr'
                  ? 'İlk sırayı kapmak için yarışmaya katılın! Puan kazanmaya başlamak için quizleri tamamlayın.'
                  : 'Be the first to claim your spot! Complete quizzes to start earning points.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950/40 backdrop-blur-md shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                        <th className="py-4 px-6 text-center w-16">{getTranslation('rank', language)}</th>
                        <th className="py-4 px-6">{getTranslation('walletAddress', language)}</th>
                        <th className="py-4 px-6 text-center">{getTranslation('streak', language)}</th>
                        <th className="py-4 px-6 text-center">{getTranslation('boost', language)}</th>
                        <th className="py-4 px-6 text-right">{getTranslation('score', language)}</th>
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
                              <span className="inline-flex items-center gap-1 gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-950/30 text-pink-400 border border-pink-900/30">
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
        <div className="space-y-8">
          
          {/* Top Button Selector for Active Special Quizzes (IDENTICAL DESIGN LANGUAGE TO CHAINS) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {challenges.length === 0 ? (
                <span className="text-xs text-gray-500 py-2">
                  {language === 'tr' ? 'Aktif özel quiz bulunmuyor.' : 'No active special quizzes.'}
                </span>
              ) : (
                challenges.map((c) => {
                  const isActive = selectedChallengeId === c.id
                  const trChallenge = (translatedChallenges as any)[c.id]
                  const cTitle = language === 'tr' && trChallenge?.title ? trChallenge.title : c.title
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChallengeId(c.id)}
                      className={`px-4 py-2 border rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-gray-950/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-900/60'
                      }`}
                    >
                      ⚡ {cTitle}
                    </button>
                  )
                })
              )}
            </div>

            {selectedChallenge?.rewardPool && (
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  🏆 {language === 'tr' ? 'Ödül Havuzu:' : 'Reward Pool:'} {selectedChallenge.rewardPool}
                </span>
              </div>
            )}
          </div>

          {/* Rankings Table for Challenge (IDENTICAL TABLE DESIGN LANGUAGE) */}
          {loadingChallenge ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">
                {language === 'tr' ? 'Yarışma sıralaması yükleniyor...' : 'Loading challenge rankings...'}
              </p>
            </div>
          ) : challengePlayers.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto backdrop-blur-sm">
              <p className="text-5xl">🎯</p>
              <h3 className="text-lg font-bold text-white">
                {language === 'tr' ? 'Henüz Sıralama Yok' : 'No Rankings Yet'}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {language === 'tr'
                  ? 'İlk katılan siz olun! Top Lider koltuğunu kapmak için quizi tamamlayın.'
                  : 'Be the first to participate in this special quiz and claim top spot!'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950/40 backdrop-blur-md shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/40">
                        <th className="py-4 px-6 text-center w-16">{getTranslation('rank', language)}</th>
                        <th className="py-4 px-6">{getTranslation('walletAddress', language)}</th>
                        <th className="py-4 px-6 text-center">
                          {language === 'tr' ? 'Tamamlama Süresi' : 'Completion Time'}
                        </th>
                        <th className="py-4 px-6 text-center">
                          {language === 'tr' ? 'Doğru Cevaplar' : 'Correct Answers'}
                        </th>
                        <th className="py-4 px-6 text-right">{getTranslation('score', language)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {challengePlayers.map((player, idx) => {
                        const globalRank = idx + 1
                        const rankStyles =
                          globalRank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          globalRank === 2 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/30' :
                          globalRank === 3 ? 'bg-amber-700/10 text-amber-600 border border-amber-700/30' :
                          'text-gray-400'

                        const qTotal = player.totalQuestions || selectedChallenge?.questionsCount || '?'

                        return (
                          <tr key={player.address} className={`transition-colors duration-150 hover:bg-gray-900/20 ${globalRank === 1 ? 'bg-amber-500/5' : ''}`}>
                            <td className="py-4 px-6 text-center font-bold">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankStyles}`}>
                                {globalRank}
                              </span>
                            </td>

                            <td className="py-4 px-6 font-mono text-sm text-gray-200">
                              {formatAddress(player.address)}
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/30 text-amber-300 border border-amber-900/30">
                                ⚡ {formatDuration(player.durationSeconds)}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-center font-mono text-xs text-gray-300">
                              {player.score} / {qTotal}
                            </td>

                            <td className="py-4 px-6 text-right font-extrabold text-white text-base">
                              {player.score}
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

    </div>
  )
}
