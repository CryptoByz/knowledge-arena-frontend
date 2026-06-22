'use client'

import { useAccount } from 'wagmi'
import { usePlayerProfile } from '../hooks/usePlayerProfile'
import { useQuizState } from '../hooks/useQuizState'
import { useChainConfig } from '../hooks/useChainConfig'
import { useReadContract } from 'wagmi'
import { ACHIEVEMENT_ABI } from '../config/abi'

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { isSupported, chainName, contracts } = useChainConfig()
  const { totalScore, weeklyScore, monthlyScore, seasonScore, streakDays, boostMultiplier } = usePlayerProfile(address)
  const { todayScore, hasSubmitted, canPlay } = useQuizState(address)

  const { data: gamesPlayed } = useReadContract({
    address: contracts?.achievementManager as `0x${string}`,
    abi: ACHIEVEMENT_ABI,
    functionName: 'gamesPlayed',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="Connect your wallet to view your profile." />
  }

  if (!isSupported) {
    return <CenteredMessage title="Wrong network" subtitle="Please switch your wallet to a supported network (ARC Testnet, Base, or Celo)." />
  }

  const boost = Number(boostMultiplier) / 100

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <span className="text-sm text-gray-400 font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>

      {/* Streak + Boost */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Current Streak</p>
          <p className="text-4xl font-bold text-orange-400">🔥 {streakDays.toString()} days</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">Score Boost</p>
          <p className="text-4xl font-bold text-indigo-400">{boost.toFixed(2)}x</p>
        </div>
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Total Score" value={totalScore.toString()} color="white" />
        <ScoreCard label="This Week" value={weeklyScore.toString()} color="indigo" />
        <ScoreCard label="This Month" value={monthlyScore.toString()} color="blue" />
        <ScoreCard label="This Season" value={seasonScore.toString()} color="purple" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Games Played</p>
          <p className="text-3xl font-bold mt-1">{gamesPlayed?.toString() ?? '0'}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Today's Participation</p>
          <p className="text-3xl font-bold mt-1">
            {hasSubmitted ? `${todayScore}/10` : canPlay ? 'Ready' : 'Completed'}
          </p>
        </div>
      </div>

      {/* Network */}
      <div className="text-center text-sm text-gray-500">
        Viewing stats on <span className="text-indigo-400">{chainName}</span>
      </div>
    </div>
  )
}

function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    white:  'text-white',
    indigo: 'text-indigo-400',
    blue:   'text-blue-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
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
