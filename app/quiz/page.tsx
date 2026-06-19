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

type Phase = 'loading' | 'enter' | 'approving' | 'entering' | 'playing' | 'submitting' | 'completed' | 'already_played' | 'not_ready'

export default function QuizPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { contracts, isSupported } = useChainConfig()
  const { switchChain } = useSwitchChain()
  const { canPlay, isTodayReady, hasSubmitted, todayScore } = useQuizState(address)

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

  // Safely parse the query parameter on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tag') || 'general'
      setTag(t)
    }
  }, [])

  const isDummyContract = !contracts?.dailyQuiz || contracts.dailyQuiz === '0x0000000000000000000000000000000000000000'

  const isWrongNetwork =
    (tag === 'arc' && chainId !== arcTestnet.id) ||
    (tag === 'base' && chainId !== baseMainnet.id) ||
    (tag === 'celo' && chainId !== celo.id) ||
    (tag === 'general' && !isSupported)

  // Determine stage on initial loading or state update
  useEffect(() => {
    if (!isConnected || isWrongNetwork) return
    if (!isTodayReady) { setPhase('not_ready'); return }
    if (hasSubmitted) { setPhase('already_played'); return }
    setPhase('enter')
  }, [isConnected, isSupported, isWrongNetwork, isTodayReady, hasSubmitted, canPlay])

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
    if (isDummyContract) {
      setPhase('entering')
      // Simulate confirmation time for nice UI transition
      setTimeout(() => {
        fetchQuestions()
      }, 850)
      return
    }

    if (!contracts) return
    setPhase('entering')
    writeContract({
      address: contracts.dailyQuiz as `0x${string}`,
      abi: DAILY_QUIZ_ABI,
      functionName: 'enterQuiz',
    })
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

      if (isDummyContract) {
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

  // Render network mismatch view
  if (isWrongNetwork && isConnected) {
    let title = 'Wrong Network'
    let subtitle = 'Please switch to a supported network to take the quiz.'
    let targetChainName = ''
    let targetChainId: number | null = null

    if (tag === 'arc') {
      title = 'Switch to ARC Testnet'
      subtitle = 'The ARC Network Quiz requires connection to ARC Testnet.'
      targetChainName = 'ARC Testnet'
      targetChainId = arcTestnet.id
    } else if (tag === 'base') {
      title = 'Switch to Base Mainnet'
      subtitle = 'The Base Mainnet Quiz requires connection to Base.'
      targetChainName = 'Base'
      targetChainId = baseMainnet.id
    } else if (tag === 'celo') {
      title = 'Switch to Celo Network'
      subtitle = 'The Celo Network Quiz requires connection to Celo.'
      targetChainName = 'Celo'
      targetChainId = celo.id
    }

    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-24">
        <div className="text-6xl animate-pulse">⛓️</div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm">{subtitle}</p>

        {targetChainId ? (
          <button
            onClick={() => switchChain({ chainId: targetChainId! })}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Switch to {targetChainName}
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Select an active network to play General Quiz:</p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => switchChain({ chainId: arcTestnet.id })}
                className="py-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800 text-indigo-300 rounded-xl font-medium transition-colors cursor-pointer text-sm"
              >
                Switch to ARC Testnet
              </button>
              <button
                onClick={() => switchChain({ chainId: baseMainnet.id })}
                className="py-2.5 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800 text-blue-300 rounded-xl font-medium transition-colors cursor-pointer text-sm"
              >
                Switch to Base Mainnet
              </button>
              <button
                onClick={() => switchChain({ chainId: celo.id })}
                className="py-2.5 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800 text-amber-300 rounded-xl font-medium transition-colors cursor-pointer text-sm"
              >
                Switch to Celo Network
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="You need a wallet to play Knowledge Arena." />
  }

  if (phase === 'not_ready') {
    return <CenteredMessage title="Quiz not ready yet" subtitle="Today's quiz is being prepared. Check back shortly." />
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
    const capitalizeTag = tag.toUpperCase();
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{capitalizeTag} Quiz</h1>
        <p className="text-gray-400">10 daily questions tailored for the {capitalizeTag === 'GENERAL' ? 'crypto industry' : `${capitalizeTag} network`} ecosystem.</p>
        
        {isDummyContract && (
          <div className="px-4 py-2 text-xs bg-amber-950/40 border border-amber-900/60 text-amber-400 rounded-xl">
            ⚠️ Smart contracts not deployed on this network. Participating in <strong>Demo Preview</strong> mode.
          </div>
        )}

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-3">
          <p className="text-gray-400 text-sm">Entry Fee</p>
          <p className="text-3xl font-black text-green-400">FREE</p>
          <p className="text-gray-500 text-xs">Prove your expertise & build onchain reputation</p>
        </div>
        <button
          onClick={handleEnterQuiz}
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          {isPending || isConfirming
            ? 'Confirming Transaction...'
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
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <div className="text-6xl animate-bounce">{finalScore >= 8 ? '🏆' : finalScore >= 5 ? '👍' : '📚'}</div>
        <h1 className="text-3xl font-extrabold text-white">{finalScore}/10 Correct</h1>
        <p className="text-gray-400">
          {finalScore === 10
            ? 'Perfect score! Outstanding!'
            : finalScore >= 8
            ? 'Great job! Almost flawless.'
            : finalScore >= 5
            ? 'Well done! Solid effort.'
            : 'Practice makes perfect. Keep reading and come back tomorrow!'}
        </p>
        
        {isDummyContract ? (
          <p className="text-amber-400 text-sm font-medium">Played in Demo Mode (Smart contracts not deployed on this network)</p>
        ) : isPending || isConfirming ? (
          <p className="text-indigo-400 text-sm animate-pulse">Saving score onchain...</p>
        ) : (
          <p className="text-green-400 text-sm font-semibold">✓ Score saved onchain!</p>
        )}

        <div className="flex gap-3 justify-center pt-4">
          <a href="/profile" className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl transition-colors text-sm font-medium">
            View Profile
          </a>
          <a href="/leaderboard" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors text-sm font-medium">
            Leaderboard
          </a>
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
