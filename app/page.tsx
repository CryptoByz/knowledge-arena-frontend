'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuizState } from './hooks/useQuizState'
import { usePlayerProfile } from './hooks/usePlayerProfile'
import { useChainConfig } from './hooks/useChainConfig'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { isSupported } = useChainConfig()
  const { canPlay, isTodayReady, hasSubmitted, todayScore } = useQuizState(address)
  const { totalScore, streakDays, boostMultiplier } = usePlayerProfile(address)

  return (
    <div className="space-y-12">

      {/* Hero */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-5xl font-bold">
          <span className="text-Black">Knowledge </span>
          <span className="text-indigo-400">Arena</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          The onchain knowledge game platform. Play daily quizzes, earn reputation, and prove your expertise on the blockchain.
        </p>

        {!isConnected ? (
          <div className="flex justify-center pt-4">
            <ConnectButton label="Connect Wallet to Play" />
          </div>
        ) : !isSupported ? (
          <div className="flex justify-center pt-4">
            <ConnectButton label="Switch to ARC or Base Sepolia" />
          </div>
        ) : (
          <div className="flex justify-center pt-4">
            <Link
              href="/quiz"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors text-lg"
            >
              {canPlay ? "Play Today's Quiz" : hasSubmitted ? "View Today's Result" : "Quiz Not Ready"}
            </Link>
          </div>
        )}
      </div>

      {/* Stats (eğer bağlıysa) */}
      {isConnected && isSupported && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Score" value={totalScore.toString()} />
          <StatCard label="Streak" value={`${streakDays.toString()} days`} />
          <StatCard label="Boost" value={`${(Number(boostMultiplier) / 100).toFixed(2)}x`} />
          <StatCard
            label="Today"
            value={hasSubmitted ? `${todayScore}/10` : canPlay ? 'Not played' : 'Played'}
          />
        </div>
      )}

      {/* Feature cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon="🧠"
          title="Daily Quiz"
          description="10 questions every day across Crypto, AI, DeFi, Tokenomics, and more. Entry fee goes directly into the reward pool."
        />
        <FeatureCard
          icon="⛓️"
          title="Onchain Reputation"
          description="Your scores, streaks, and achievements are stored on the blockchain. Build a verifiable knowledge profile over time."
        />
        <FeatureCard
          icon="🏆"
          title="Earn Rewards"
          description="Top players on weekly, monthly, and season leaderboards earn USDC and exclusive NFT badges."
        />
      </div>

      {/* Supported chains */}
      <div className="text-center space-y-3">
        <p className="text-gray-500 text-sm uppercase tracking-wider">Available on</p>
        <div className="flex justify-center gap-4">
          <ChainBadge name="ARC Testnet" color="indigo" />
          <ChainBadge name="Base Mainnet" color="blue" />
        </div>
      </div>

    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
      <div className="text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function ChainBadge({ name, color }: { name: string; color: 'indigo' | 'blue' }) {
  const colors = {
    indigo: 'bg-indigo-900 text-indigo-300 border-indigo-700',
    blue:   'bg-blue-900 text-blue-300 border-blue-700',
  }
  return (
    <span className={`px-4 py-2 rounded-full text-sm border ${colors[color]}`}>
      {name}
    </span>
  )
}
