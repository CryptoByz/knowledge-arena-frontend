'use client'

import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuizState } from './hooks/useQuizState'
import { usePlayerProfile } from './hooks/usePlayerProfile'
import { useChainConfig } from './hooks/useChainConfig'
import { arcTestnet, baseMainnet, celo } from './config/chains'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { isSupported } = useChainConfig()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const router = useRouter()

  const { canPlay, hasSubmitted, todayScore } = useQuizState(address)
  const { totalScore, streakDays, boostMultiplier } = usePlayerProfile(address)

  const handlePlayQuiz = async (tag: string, targetChainId?: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    if (targetChainId && chainId !== targetChainId) {
      try {
        await switchChainAsync({ chainId: targetChainId })
      } catch (err) {
        console.error('Failed to switch network:', err)
      }
    }

    router.push(`/quiz?tag=${tag}`)
  }

  return (
    <div className="space-y-12">
      {/* Hero Banner with Glow Effect */}
      <div className="relative text-center space-y-4 pt-12 pb-6 overflow-hidden rounded-3xl bg-radial from-indigo-900/20 via-transparent to-transparent">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Knowledge </span>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Arena</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
          The ultimate onchain knowledge platform.
        </p>

        {!isConnected && (
          <div className="flex justify-center pt-6 animate-bounce">
            <ConnectButton label="Connect Wallet to Play" />
          </div>
        )}
      </div>

      {/* Stats Board (Visible if connected & on supported chain) */}
      {isConnected && isSupported && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-900/30 border border-gray-800/60 rounded-xl max-w-3xl mx-auto backdrop-blur-md">
          <StatCard label="Total Score" value={totalScore.toString()} color="text-indigo-400" />
          <StatCard label="Streak" value={`${streakDays.toString()} days`} color="text-pink-400" />
          <StatCard label="Boost Multiplier" value={`${(Number(boostMultiplier) / 100).toFixed(2)}x`} color="text-purple-400" />
          <StatCard
            label="Today's Participation"
            value={hasSubmitted ? `${todayScore}/10` : canPlay ? 'Ready' : 'Completed'}
            color={hasSubmitted ? 'text-green-400' : 'text-amber-400'}
          />
        </div>
      )}

      {/* Quiz Cards Selection Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-wide text-white border-l-4 border-indigo-500 pl-3">
          Select Your Arena
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ARC Quiz Card */}
          <QuizCard
            title="ARC Network Quiz"
            description="Test your skills on ARC ecology, including gasless token transactions, scalability, and stablecoins."
            gradient="from-indigo-950/80 via-purple-900/30 to-gray-950"
            borderHover="hover:border-indigo-500"
            bulletColor="bg-indigo-500"
            bullets={['ARC Testnet (Chain 5042002)', 'Native Gas Stablecoins', 'Ecosystem Trivia']}
            buttonText="Enter ARC Arena"
            onClick={() => handlePlayQuiz('arc', arcTestnet.id)}
          />
 
          {/* Base Mainnet Quiz Card */}
          <QuizCard
            title="Base Mainnet Quiz"
            description="Challenge yourself on the Base L2 ecosystem. Answer questions on Ethereum scaling, rollups, and Coinbase tools."
            gradient="from-blue-950/80 via-cyan-900/30 to-gray-950"
            borderHover="hover:border-blue-500"
            bulletColor="bg-blue-500"
            bullets={['Base Mainnet (Chain 8453)', 'Fast, Low-cost L2', 'Ecosystem Trivia']}
            buttonText="Enter Base Arena"
            onClick={() => handlePlayQuiz('base', baseMainnet.id)}
          />
 
          {/* Celo Network Quiz Card */}
          <QuizCard
            title="Celo Network Quiz"
            description="Delve into the Celo network. Learn about carbon-negativity, mobile-first design, and decentralized finance (ReFi)."
            gradient="from-amber-950/80 via-yellow-900/30 to-gray-950"
            borderHover="hover:border-amber-500"
            bulletColor="bg-amber-500"
            bullets={['Celo Network (Chain 42220)', 'Mobile-First & ReFi', 'Ecosystem Trivia']}
            buttonText="Enter Celo Arena"
            onClick={() => handlePlayQuiz('celo', celo.id)}
          />
 
          {/* General Crypto Quiz Card */}
          <QuizCard
            title="General Crypto Quiz"
            description="Classic, general cryptocurrency questions. Test your fundamentals on Bitcoin, DeFi, Ethereum, and consensus systems."
            gradient="from-emerald-950/80 via-teal-900/30 to-gray-950"
            borderHover="hover:border-emerald-500"
            bulletColor="bg-emerald-500"
            bullets={['Base Mainnet (Chain 8453)', 'General Industry Trivia', 'Web3 Fundamentals']}
            buttonText="Enter General Arena"
            onClick={() => handlePlayQuiz('general', baseMainnet.id)}
          />
        </div>
      </div>

      {/* Feature Section */}
      <div className="grid md:grid-cols-2 gap-6 pt-6">
        <FeatureCard
          icon="🧠"
          title="Daily Challenge Pools"
          description="Each chain features a custom daily quiz plus a shared general crypto quiz. Deduplicated and committed to the blockchain every 24 hours."
        />
        <FeatureCard
          icon="⛓️"
          title="Verifiable Onchain Proofs"
          description="Your answers are validated locally and verified onchain using Cryptographic Merkle Proofs. Prove your knowledge transparently."
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-950/60 border border-gray-800/50 rounded-lg p-2.5 text-center backdrop-blur-sm shadow-inner transition-transform duration-300 hover:scale-102">
      <p className={`text-lg font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-3 backdrop-blur-sm transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/80">
      <div className="text-3xl">{icon}</div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

type QuizCardProps = {
  title: string
  description: string
  gradient: string
  borderHover: string
  bulletColor: string
  bullets: string[]
  buttonText: string
  onClick: () => void
}

function QuizCard({
  title,
  description,
  gradient,
  borderHover,
  bulletColor,
  bullets,
  buttonText,
  onClick,
}: QuizCardProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-800/80 bg-gradient-to-br ${gradient} p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 ${borderHover} hover:shadow-2xl`}
    >
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
            {title}
          </h3>
        </div>

        {/* Card Body */}
        <p className="text-sm text-gray-400 leading-relaxed min-h-[3.75rem]">
          {description}
        </p>

        {/* Feature Bullets */}
        <ul className="space-y-1.5 pt-2">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
              <span className={`w-1.5 h-1.5 rounded-full ${bulletColor}`} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Play Button */}
      <div className="pt-6">
        <button
          onClick={onClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white text-white hover:text-black font-semibold text-sm rounded-xl border border-white/15 hover:border-white transition-all duration-300 select-none cursor-pointer"
        >
          <span>{buttonText}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
