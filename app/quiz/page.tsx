'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { useChainConfig } from '../hooks/useChainConfig'
import { useQuizState } from '../hooks/useQuizState'
import { DAILY_QUIZ_ABI } from '../config/abi'
import { API_URL, arcTestnet, baseMainnet, celo } from '../config/chains'

type Question = {
  index: number
  id: string
  category: string
  difficulty: string
  question: string
  options: { A: string; B: string; C: string; D: string }
}

type Phase = 'loading' | 'enter' | 'approving' | 'entering' | 'playing' | 'submitting' | 'completed' | 'already_played'

export default function QuizPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { contracts, isSupported } = useChainConfig()
  const { switchChain } = useSwitchChain()
  const { canPlay, isTodayReady, hasSubmitted, todayScore, hasEnteredToday } = useQuizState(address)

  const [mounted, setMounted] = useState(false)
  const [tag, setTag] = useState('general')
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isSelectionCorrect, setIsSelectionCorrect] = useState<boolean | null>(null)
  const [correctOption, setCorrectOption] = useState<string | null>(null)
  const [showCorrectOption, setShowCorrectOption] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Safely parse the query parameter on client mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tag') || 'general'
      setTag(t)
    }
  }, [])

  const targetChainId =
    tag === 'arc' ? arcTestnet.id :
    tag === 'base' ? baseMainnet.id :
    tag === 'celo' ? celo.id :
    baseMainnet.id // General quiz is fixed to Base Mainnet

  const isWrongNetwork = chainId !== targetChainId

  const isDummyContract = !contracts?.dailyQuiz || (contracts.dailyQuiz as string) === '0x0000000000000000000000000000000000000000'
  const isDemoMode = isDummyContract || !isTodayReady

  // Determine stage on initial loading or state update
  useEffect(() => {
    if (!mounted || !isConnected || isWrongNetwork) return

    // In production/normal mode, check if already played
    if (!isDemoMode) {
      if (hasSubmitted) {
        setPhase('already_played')
        return
      }
      if (!canPlay && !hasEnteredToday) {
        setPhase('already_played')
        return
      }
    }

    setPhase('enter')
  }, [mounted, isConnected, isWrongNetwork, isTodayReady, hasSubmitted, canPlay, hasEnteredToday, isDemoMode])

  // TX confirmation watcher for phase changes
  useEffect(() => {
    if (!isSuccess || !txHash) return
    if (phase === 'approving') {
      handleEnterQuiz()
    } else if (phase === 'entering') {
      fetchQuestions()
    }
  }, [isSuccess, txHash])

  const handleEnterQuiz = async () => {
    if (isDemoMode || hasEnteredToday) {
      setPhase('entering')
      // Simulate confirmation time for nice UI transition
      setTimeout(() => {
        fetchQuestions()
      }, 850)
      return
    }

    if (!contracts) return

    // Base Sepolia (84532) uses ERC20 USDC which requires approval first
    const isERC20 = chainId === 84532;
    
    if (isERC20 && phase === 'enter') {
      setPhase('approving');
      const tokenAddress = '0x036cbd53842c5426634e7929541ec2318f3dcf7e'; // Base Sepolia USDC
      const feeAmount = 2000000n; // 2.00 USDC (6 decimals)

      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [contracts.dailyQuiz as `0x${string}`, feeAmount]
      });
      return;
    }

    // Determine native token value (for Base/ARC/Celo)
    let value = 0n;
    if (chainId === 5042002) {
      value = 2000000n; // 2 USDC (native, 6 decimals)
    } else if (chainId === 8453) {
      value = 300000000000000n; // 0.0003 ETH (18 decimals)
    } else if (chainId === 42220) {
      value = 500000000000000000n; // 0.5 CELO (native, 18 decimals)
    }

    setPhase('entering');
    writeContract({
      address: contracts.dailyQuiz as `0x${string}`,
      abi: DAILY_QUIZ_ABI,
      functionName: 'enterQuiz',
      value: value > 0n ? value : undefined,
    });
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/daily-questions?tag=${tag}&chainId=${chainId}`)
      const data = await res.json()
      setQuestions(data.questions)
      setPhase('playing')
    } catch {
      alert('Failed to fetch questions. Please try again.')
      setPhase('enter')
    }
  }

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return
    setSelectedAnswer(answer)

    try {
      // Get proof and correctness for all 4 options to display the right selection
      const res = await fetch(`${API_URL}/api/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          tag,
          answers: ['A', 'B', 'C', 'D'].map(opt => ({
            questionIndex: currentIndex,
            answer: opt,
          })),
        }),
      })
      const data = await res.json()
      
      const correctIndex = data.proofs.findIndex((p: any) => p.isCorrect)
      const correctOpt = correctIndex !== -1 ? ['A', 'B', 'C', 'D'][correctIndex] : null
      
      setCorrectOption(correctOpt)
      
      if (answer === correctOpt) {
        setIsSelectionCorrect(true)
        
        setTimeout(() => {
          const newAnswers = [...answers, answer]
          setAnswers(newAnswers)
          setSelectedAnswer(null)
          setIsSelectionCorrect(null)
          setCorrectOption(null)

          if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1)
          } else {
            handleSubmit(newAnswers)
          }
        }, 2200)
      } else {
        setIsSelectionCorrect(false)
        
        // Show correct option after 800ms
        setTimeout(() => {
          setShowCorrectOption(true)
          
          // Move to next question after 2.2 seconds
          setTimeout(() => {
            const newAnswers = [...answers, answer]
            setAnswers(newAnswers)
            setSelectedAnswer(null)
            setIsSelectionCorrect(null)
            setCorrectOption(null)
            setShowCorrectOption(false)

            if (currentIndex + 1 < questions.length) {
              setCurrentIndex(currentIndex + 1)
            } else {
              handleSubmit(newAnswers)
            }
          }, 2200)
        }, 800)
      }
    } catch (err) {
      console.error(err)
      // Fallback
      setTimeout(() => {
        const newAnswers = [...answers, answer]
        setAnswers(newAnswers)
        setSelectedAnswer(null)
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(currentIndex + 1)
        } else {
          handleSubmit(newAnswers)
        }
      }, 1500)
    }
  }

  const handleSubmit = async (finalAnswers: string[]) => {
    if (!contracts) return
    setPhase('submitting')

    try {
      const res = await fetch(`${API_URL}/api/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          tag,
          answers: questions.map((q, i) => ({
            questionIndex: i,
            answer: finalAnswers[i],
          })),
        }),
      })
      const data = await res.json()

      const answerHashes = data.proofs.map((p: any) => p.answerHash as `0x${string}`)
      const proofs = data.proofs.map((p: any) => p.proof as `0x${string}`[])

      const score = data.proofs.filter((p: any) => p.isCorrect).length
      setFinalScore(score)

      if (isDemoMode) {
        setPhase('completed')
        return
      }

      writeContract({
        address: contracts.dailyQuiz as `0x${string}`,
        abi: DAILY_QUIZ_ABI,
        functionName: 'submitAnswers',
        args: [answerHashes, proofs],
      })

      setPhase('completed')
    } catch {
      alert('Failed to submit answers. Please try again.')
      setPhase('playing')
    }
  }

  // Hydration guard
  if (!mounted) {
    return <CenteredMessage title="Loading Arena..." subtitle="Initializing the quiz interface..." />
  }

  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="You need a wallet to play Knowledge Arena." />
  }

  // Render network mismatch view
  if (isWrongNetwork) {
    let title = 'Wrong Network'
    let subtitle = 'Please switch to a supported network to take the quiz.'
    let targetChainName = ''

    if (tag === 'arc') {
      title = 'Switch to ARC Testnet'
      subtitle = 'The ARC Network Quiz requires connection to ARC Testnet.'
      targetChainName = 'ARC Testnet'
    } else if (tag === 'base') {
      title = 'Switch to Base Mainnet'
      subtitle = 'The Base Mainnet Quiz requires connection to Base Mainnet.'
      targetChainName = 'Base'
    } else if (tag === 'celo') {
      title = 'Switch to Celo Network'
      subtitle = 'The Celo Network Quiz requires connection to Celo.'
      targetChainName = 'Celo'
    } else if (tag === 'general') {
      title = 'Switch to Base Mainnet'
      subtitle = 'The General Crypto Quiz requires connection to Base Mainnet.'
      targetChainName = 'Base'
    }

    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-24">
        <div className="text-6xl animate-pulse">⛓️</div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{subtitle}</p>

        <button
          onClick={() => switchChain({ chainId: targetChainId })}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          Switch to {targetChainName}
        </button>
      </div>
    )
  }

  if (phase === 'already_played') {
    return (
      <CenteredMessage
        title={`Today's score: ${todayScore}/10`}
        subtitle="You've already played today. Come back tomorrow for a new quiz!"
      />
    )
  }

  if (phase === 'enter') {
    const networkNames: Record<string, string> = {
      arc: 'ARC',
      base: 'Base',
      celo: 'Celo',
      general: 'General',
    };
    const networkName = networkNames[tag] || tag.toUpperCase();

    const feeDisplays: Record<string, string> = {
      arc: '2.00 USDC',
      celo: '0.50 CELO',
      base: '0.0003 ETH',
      general: '0.0003 ETH',
    };
    const feeText = feeDisplays[tag] || '0.00 USDC';

    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{networkName} Daily Quiz</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          10 daily questions tailored for the {tag === 'general' ? 'crypto industry' : `${networkName} network`} ecosystem.
          Comprising 4 easy, 2 medium, and 2 hard questions, and 2 random general category questions.
        </p>
        
        {isDemoMode && (
          <div className="px-4 py-2.5 text-xs bg-amber-950/40 border border-amber-900/60 text-amber-400 rounded-xl leading-relaxed">
            ⚠️ {isDummyContract ? 'Smart contracts are not yet deployed' : 'Quiz not yet initialized onchain'} for this network. Running in <strong>Demo Preview Mode</strong>.
          </div>
        )}

        {hasEnteredToday && !isDemoMode && (
          <div className="px-4 py-2.5 text-xs bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 rounded-xl leading-relaxed">
            ⚡ You have already registered entry today. Click below to start playing.
          </div>
        )}

        <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl px-4 py-3 flex items-center justify-between text-sm max-w-sm mx-auto">
          <span className="text-gray-400 font-medium">Entry Fee</span>
          <span className="font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-lg text-xs">
            {feeText}
          </span>
        </div>
        <button
          onClick={handleEnterQuiz}
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          {isPending || isConfirming
            ? 'Confirming Transaction...'
            : isDemoMode
            ? 'Start Quiz (Demo Mode)'
            : hasEnteredToday
            ? 'Start Quiz'
            : 'Start Quiz'}
        </button>
      </div>
    )
  }

  if (phase === 'approving' || phase === 'entering') {
    return (
      <CenteredMessage
        title="Entering Quiz..."
        subtitle="Please confirm the entry in your wallet."
      />
    )
  }

  if (phase === 'submitting') {
    return <CenteredMessage title="Submitting Answers..." subtitle="Please confirm the scoring transaction in your wallet." />
  }

  if (phase === 'completed') {
    const chainName = tag.toUpperCase()
    const networkName = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()

    // Define colors and styles based on chain
    const themeColors: Record<string, { accent: string, border: string, textGlow: string, bgGlow: string }> = {
      celo: {
        accent: 'from-amber-400 to-yellow-500',
        border: 'border-amber-500/30 hover:border-amber-500/60',
        textGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
        bgGlow: 'from-amber-950/20 via-transparent to-transparent',
      },
      base: {
        accent: 'from-blue-400 to-indigo-500',
        border: 'border-blue-500/30 hover:border-blue-500/60',
        textGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.35)]',
        bgGlow: 'from-blue-950/20 via-transparent to-transparent',
      },
      arc: {
        accent: 'from-purple-400 to-indigo-500',
        border: 'border-purple-500/30 hover:border-purple-500/60',
        textGlow: 'shadow-[0_0_20px_rgba(139,92,246,0.35)]',
        bgGlow: 'from-purple-950/20 via-transparent to-transparent',
      },
      general: {
        accent: 'from-indigo-400 to-purple-500',
        border: 'border-indigo-500/30 hover:border-indigo-500/60',
        textGlow: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
        bgGlow: 'from-indigo-950/20 via-transparent to-transparent',
      },
    }

    const theme = themeColors[tag.toLowerCase()] || themeColors.general

    // Prefill X share text & url
    const tweetText = `I just scored ${finalScore}/10 on the ${networkName} Daily Quiz at Knowledge Arena! 🧠 Join the arena:`
    const shareUrl = `https://knowledge-arena.xyz/?score=${finalScore}&chain=${tag}`
    const xShareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`

    return (
      <div className="max-w-lg mx-auto text-center space-y-8 pt-8">
        <div className="space-y-3">
          <div className="text-6xl animate-bounce">{finalScore >= 8 ? '🏆' : finalScore >= 5 ? '👍' : '📚'}</div>
          <h1 className="text-3xl font-black text-white">{finalScore}/10 Correct</h1>
          <p className="text-gray-400 max-w-sm mx-auto text-sm">
            {finalScore === 10
              ? 'Perfect score! Outstanding!'
              : finalScore >= 8
              ? 'Great job! Almost flawless.'
              : finalScore >= 5
              ? 'Well done! Solid effort.'
              : 'Practice makes perfect. Keep reading and come back tomorrow!'}
          </p>
        </div>

        {/* Visual Card Preview */}
        <div className={`relative overflow-hidden rounded-3xl border ${theme.border} bg-gray-950/80 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 text-left`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))]" />
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-md font-black tracking-wider text-white">KNOWLEDGE ARENA</span>
                <span className="text-[9px] text-gray-500 tracking-wider font-bold block uppercase">Onchain Trivia</span>
              </div>
              <span className={`px-3 py-1 rounded-xl border border-white/5 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent font-black tracking-wider text-xs uppercase`}>
                {networkName} Arena
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-[10px] text-gray-500 tracking-[0.25em] font-extrabold block mb-1 uppercase">
                Score Obtained
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-7xl font-black text-white drop-shadow-md">
                  {finalScore}
                </span>
                <span className="text-3xl text-gray-700 font-bold">/</span>
                <span className="text-3xl text-gray-500 font-bold">10</span>
              </div>
            </div>

            <div className="border-t border-gray-900 pt-4 flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-[10px] text-green-400 font-bold tracking-wide uppercase">
                  Verified Onchain
                </span>
              </div>
              <span className="text-[9px] text-gray-600 tracking-wider font-bold uppercase">
                {isDemoMode ? 'Demo Preview' : 'Onchain Signed'}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {isDemoMode ? (
          <p className="text-amber-400 text-xs font-semibold">Played in Demo Mode (Score not saved onchain)</p>
        ) : isPending || isConfirming ? (
          <p className="text-indigo-400 text-xs font-semibold animate-pulse">Saving score onchain...</p>
        ) : (
          <p className="text-green-400 text-xs font-semibold">✓ Score successfully committed onchain!</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href={xShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-black hover:bg-neutral-900 border border-neutral-850 text-white font-extrabold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg shadow-black/20"
          >
            {/* X Logo SVG */}
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>
          <div className="flex gap-3 w-full sm:w-auto">
            <a href="/profile" className="flex-1 sm:flex-none px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold text-sm rounded-xl transition-all text-center">
              View Profile
            </a>
            <a href="/leaderboard" className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all text-center">
              Leaderboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Quiz running phase
  const question = questions[currentIndex]
  if (!question) return null

  const progress = (currentIndex / questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress & Category */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400 font-medium">
          <span className="uppercase tracking-wider text-indigo-400">{question.category}</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-gray-900 border border-gray-850 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <p className="text-lg font-semibold leading-relaxed text-gray-100">{question.question}</p>
      </div>

      {/* Answers List */}
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(question.options).map(([key, value]) => {
          let style = 'bg-gray-900 border-gray-800 text-gray-200 hover:border-indigo-500 hover:bg-gray-850/60'

          if (selectedAnswer) {
            if (key === selectedAnswer) {
              if (isSelectionCorrect === true) {
                style = 'bg-green-950/40 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
              } else if (isSelectionCorrect === false) {
                style = 'bg-red-950/40 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              } else {
                style = 'bg-indigo-950/30 border-indigo-500/55 text-indigo-300 animate-pulse'
              }
            } else if (key === correctOption && showCorrectOption) {
              style = 'bg-green-950/40 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
            } else {
              style = 'bg-gray-950/40 border-gray-950/60 text-gray-500 opacity-50'
            }
          }

          return (
            <button
              key={key}
              onClick={() => handleAnswer(key)}
              disabled={!!selectedAnswer}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${style} disabled:cursor-not-allowed cursor-pointer font-medium`}
            >
              <span className={`font-bold mr-3 transition-colors duration-300 ${
                selectedAnswer 
                  ? key === selectedAnswer
                    ? isSelectionCorrect === true 
                      ? 'text-green-400' 
                      : isSelectionCorrect === false 
                        ? 'text-red-400' 
                        : 'text-indigo-400'
                    : key === correctOption && showCorrectOption
                      ? 'text-green-400'
                      : 'text-gray-700'
                  : 'text-indigo-400'
              }`}>{key}</span>
              <span>{value}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CenteredMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-3 pt-24">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">{subtitle}</p>
    </div>
  )
}
