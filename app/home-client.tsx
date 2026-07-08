'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit'
import { useQuizState } from './hooks/useQuizState'
import { usePlayerProfile } from './hooks/usePlayerProfile'
import { useChainConfig } from './hooks/useChainConfig'
import { API_URL, arcTestnet, baseMainnet, celo } from './config/chains'
import { useLanguage } from './context/LanguageContext'
import { getTranslation, Lang } from './config/translations'
import translatedChallenges from './config/translatedChallenges.json'

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

export default function HomeClient({ filterChain }: { filterChain?: 'arc' | 'base' | 'celo' }) {
  const { address, isConnected } = useAccount()
  const { isSupported } = useChainConfig()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const router = useRouter()
  const { openConnectModal } = useConnectModal()
  const { language } = useLanguage()

  const { canPlay, hasSubmitted, todayScore } = useQuizState(address)
  const { totalScore, streakDays, boostMultiplier } = usePlayerProfile(address)

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loadingChallenges, setLoadingChallenges] = useState<boolean>(true)

  const targetChainId = filterChain === 'arc' ? 5042002 : filterChain === 'celo' ? 42220 : filterChain === 'base' ? 8453 : null
  const targetChainName = filterChain === 'arc' ? 'ARC Testnet' : filterChain === 'celo' ? 'Celo' : filterChain === 'base' ? 'Base' : ''
  const isWrongFilteredNetwork = isConnected && targetChainId && chainId !== targetChainId

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/challenges`)
      if (res.ok) {
        const data: Challenge[] = await res.json()
        setChallenges(data.filter(c => c.isActive))
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err)
    } finally {
      setLoadingChallenges(false)
    }
  }

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

  const handlePlayChallenge = async (challenge: Challenge) => {
    if (!isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    if (challenge.chainId && chainId !== challenge.chainId) {
      try {
        await switchChainAsync({ chainId: challenge.chainId })
      } catch (err) {
        console.error('Failed to switch network:', err)
      }
    }

    const tag = challenge.chainId === 5042002 ? 'arc' : challenge.chainId === 42220 ? 'celo' : 'base'
    router.push(`/quiz?challengeId=${challenge.id}&tag=${tag}`)
  }

  const filteredChallenges = challenges.filter(c => {
    if (!filterChain) return true;
    return c.chainId === targetChainId;
  })

  return (
    <div className="space-y-12">
      {/* Hero Banner with Glow Effect */}
      <div className="relative text-center space-y-4 pt-12 pb-6 overflow-hidden rounded-3xl bg-radial from-indigo-900/20 via-transparent to-transparent">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Knowledge </span>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Arena</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
          {filterChain 
            ? getTranslation('specialArenaTitle', language).replace('{chainName}', targetChainName)
            : getTranslation('dailyChallengePoolsDesc', language)
          }
        </p>

        {!isConnected && !filterChain && (
          <div className="flex justify-center pt-6 animate-bounce">
            <ConnectButton label={getTranslation('connectToPlay', language)} />
          </div>
        )}
      </div>

      {/* Network Switch / Wallet Connect Overlay when chain-specific link is used */}
      {((!isConnected && filterChain) || isWrongFilteredNetwork) && (
        <div className="max-w-xl mx-auto bg-gray-900/80 border-2 border-indigo-500/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="text-5xl animate-bounce">⛓️</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">
              {getTranslation('connectToChainMsg', language).replace('{chainName}', targetChainName)}
            </h2>
          </div>
          
          <button
            onClick={async () => {
              if (!isConnected) {
                if (openConnectModal) {
                  openConnectModal()
                } else {
                  alert('Cüzdan bağlama modülü yüklenemedi. Lütfen sağ üstteki Connect butonunu kullanın.')
                }
                return
              }
              if (targetChainId) {
                try {
                  await switchChainAsync({ chainId: targetChainId })
                } catch (err) {
                  console.error(err)
                }
              }
            }}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            {isConnected 
              ? getTranslation('switchChainBtn', language).replace('{chainName}', targetChainName)
              : getTranslation('connectAndSwitchBtn', language)
            }
          </button>
        </div>
      )}

      {/* 🔥 FLASH & PRIVATE EVENTS (SPECIAL CHALLENGES) SECTION */}
      {filteredChallenges.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h2 className="text-2xl font-black tracking-wide text-white uppercase flex items-center gap-2">
                {getTranslation('flashEvents', language)}
              </h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {getTranslation('timedChallenges', language)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredChallenges.map((ch) => (
              <FlashChallengeCard
                key={ch.id}
                challenge={ch}
                onPlay={() => handlePlayChallenge(ch)}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quiz Cards Selection Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-wide text-white border-l-4 border-indigo-500 pl-3">
          {getTranslation('selectArena', language)}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Celo Network Quiz Card */}
          {(!filterChain || filterChain === 'celo') && (
            <QuizCard
              title={getTranslation('celoQuizTitle', language)}
              description={getTranslation('celoQuizDesc', language)}
              gradient="from-amber-950/80 via-yellow-900/30 to-gray-950"
              borderHover="hover:border-amber-500"
              bulletColor="bg-amber-500"
              bullets={['Celo Network', language === 'tr' ? 'Mobil Öncelikli & ReFi' : 'Mobile-First & ReFi', language === 'tr' ? 'Ekosistem Soruları' : 'Ecosystem Trivia']}
              buttonText={getTranslation('enterCeloArena', language)}
              onClick={() => handlePlayQuiz('celo', celo.id)}
            />
          )}
 
          {/* General Crypto Quiz Card (Shows on Celo filter as well) */}
          {(!filterChain || filterChain === 'celo') && (
            <QuizCard
              title={getTranslation('generalQuizTitle', language)}
              description={getTranslation('generalQuizDesc', language)}
              gradient="from-emerald-950/80 via-teal-900/30 to-gray-950"
              borderHover="hover:border-emerald-500"
              bulletColor="bg-emerald-500"
              bullets={['Celo Network', language === 'tr' ? 'Genel Sektör Soruları' : 'General Industry Trivia', language === 'tr' ? 'Web3 Temelleri' : 'Web3 Fundamentals']}
              buttonText={getTranslation('enterGeneralArena', language)}
              onClick={() => handlePlayQuiz('general', celo.id)}
            />
          )}
        </div>
      </div>

      {/* Feature Section */}
      <div className="grid md:grid-cols-2 gap-6 pt-6">
        <FeatureCard
          icon="🧠"
          title={getTranslation('dailyChallengePools', language)}
          description={getTranslation('dailyChallengePoolsDesc', language)}
        />
        <FeatureCard
          icon="⛓️"
          title={getTranslation('verifiableProofs', language)}
          description={getTranslation('verifiableProofsDesc', language)}
        />
      </div>
    </div>
  )
}

function FlashChallengeCard({ challenge, onPlay, language }: { challenge: Challenge, onPlay: () => void, language: Lang }) {
  const chainName = 
    challenge.chainId === 5042002 ? 'ARC Testnet' : 
    challenge.chainId === 42220 ? 'Celo Mainnet' : 
    challenge.chainId === 84532 ? 'Base Sepolia' : 'Base Mainnet'

  const trData = (translatedChallenges as any)[challenge.id]
  const title = language === 'tr' && trData?.title ? trData.title : challenge.title
  const description = language === 'tr' && trData?.description ? trData.description : challenge.description

  return (
    <div className="relative group overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/70 via-purple-950/80 to-gray-950 p-6 md:p-8 shadow-2xl shadow-amber-500/10 transition-all duration-300 hover:border-amber-400 hover:shadow-amber-500/20">
      
      {/* Background Decorative Glow */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Info Column */}
        <div className="space-y-3 max-w-2xl">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-500 text-gray-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              ⚡ {language === 'tr' ? 'Özel Etkinlik' : 'Flash Event'}
            </span>
            
            <span className="bg-gray-900/80 text-gray-300 border border-gray-700 font-medium text-[11px] px-3 py-1 rounded-full">
              🌐 {chainName}
            </span>

            {challenge.rewardPool && (
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1">
                🏆 {challenge.rewardPool}
              </span>
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white group-hover:text-amber-200 transition-colors">
            {title}
          </h3>

          <p className="text-gray-300 text-sm leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 font-mono">
            <span>⏱️ {language === 'tr' ? 'Sınırlı Süreli Özel Etkinlik' : 'Time-Limited Special Challenge'}</span>
            <span>•</span>
            <span>❓ {challenge.questionsCount || 0} {language === 'tr' ? 'Özel Soru' : 'Special Questions'}</span>
          </div>

        </div>

        {/* Right CTA Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onPlay}
            className="w-full md:w-auto flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <span>{language === 'tr' ? 'Özel Yarışmaya Katıl' : 'Enter Special Quiz'}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
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
}: {
  title: string
  description: string
  gradient: string
  borderHover: string
  bulletColor: string
  bullets: string[]
  buttonText: string
  onClick: () => void
}) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-800/80 bg-gradient-to-br ${gradient} p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 ${borderHover} hover:shadow-2xl`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
            {title}
          </h3>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed min-h-[3.75rem]">
          {description}
        </p>

        <ul className="space-y-1.5 pt-2">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
              <span className={`w-1.5 h-1.5 rounded-full ${bulletColor}`} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

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

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-3 backdrop-blur-sm transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/80">
      <div className="text-3xl">{icon}</div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
