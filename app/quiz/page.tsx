'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useChainConfig } from '../hooks/useChainConfig'
import { useQuizState } from '../hooks/useQuizState'
import { DAILY_QUIZ_ABI } from '../config/abi'
import { API_URL } from '../config/chains'

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
  const { contracts, isSupported } = useChainConfig()
  const { canPlay, isTodayReady, hasSubmitted, todayScore, entryFee, refetchCanPlay } = useQuizState(address)

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  Ilk yüklemede durumu belirle
  useEffect(() => {
    if (!isConnected || !isSupported) return
    if (!isTodayReady) { setPhase('not_ready'); return }
    if (hasSubmitted) { setPhase('already_played'); return }
    if (canPlay) { setPhase('enter'); return }
    setPhase('enter')
  }, [isConnected, isSupported, isTodayReady, hasSubmitted, canPlay])

  // TX tamamlandığında phase geçişi
  useEffect(() => {
    if (!isSuccess || !txHash) return
    if (phase === 'approving') {
      handleEnterQuiz()
    } else if (phase === 'entering') {
      fetchQuestions()
    }
  }, [isSuccess, txHash])

  const handleEnterQuiz = async () => {
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
      const res = await fetch(`${API_URL}/api/daily-questions`)
      const data = await res.json()
      setQuestions(data.questions)
      setPhase('playing')
    } catch {
      alert('Failed to fetch questions. Please try again.')
      setPhase('enter')
    }
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return // Zaten cevap verildi
    setSelectedAnswer(answer)
    setShowResult(true)

    setTimeout(() => {
      const newAnswers = [...answers, answer]
      setAnswers(newAnswers)
      setSelectedAnswer(null)
      setShowResult(false)

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Quiz bitti, cevapları gönder
        handleSubmit(newAnswers)
      }
    }, 1500)
  }

  const handleSubmit = async (finalAnswers: string[]) => {
    if (!contracts) return
    setPhase('submitting')

    try {
      // RPi5'ten proof al
      const res = await fetch(`${API_URL}/api/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: questions.map((q, i) => ({
            questionIndex: i,
            answer: finalAnswers[i],
          })),
        }),
      })
      const data = await res.json()

      // Answer hash'leri ve proof'ları hazırla
      const answerHashes = data.proofs.map((p: any) => p.answerHash as `0x${string}`)
      const proofs = data.proofs.map((p: any) => p.proof as `0x${string}`[])

      // Lokal skor hesapla (UI için)
      const score = data.proofs.filter((p: any) => p.isCorrect).length
      setFinalScore(score)

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

  Render
  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="You need a wallet to play Knowledge Arena." />
  }

  if (!isSupported) {
    return <CenteredMessage title="Wrong network" subtitle="Please switch to ARC Testnet or Base Sepolia." />
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
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <h1 className="text-3xl font-bold">Daily Quiz</h1>
        <p className="text-gray-400">10 questions across Crypto, AI, DeFi, Tokenomics, and more.</p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <p className="text-gray-400 text-sm">Entry Fee</p>
          <p className="text-3xl font-bold text-indigo-400">10 USDC</p>
          <p className="text-gray-500 text-xs">Goes directly into the weekly reward pool</p>
        </div>
        <button
          onClick={handleEnterQuiz}
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {isPending || isConfirming
            ? 'Confirming...'
            : 'Enter Quiz (10 USDC)'}
        </button>
      </div>
    )
  }

  if (phase === 'approving' || phase === 'entering') {
    return (
      <CenteredMessage
        title={phase === 'approving' ? 'Approving USDC...' : 'Entering quiz...'}
        subtitle="Please confirm the transaction in your wallet."
      />
    )
  }

  if (phase === 'submitting') {
    return <CenteredMessage title="Submitting answers..." subtitle="Please confirm the transaction in your wallet." />
  }

  if (phase === 'completed') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <div className="text-6xl">{finalScore >= 8 ? '🏆' : finalScore >= 5 ? '👍' : '📚'}</div>
        <h1 className="text-3xl font-bold">{finalScore}/10 Correct</h1>
        <p className="text-gray-400">
          {finalScore === 10
            ? 'Perfect score! Incredible!'
            : finalScore >= 8
            ? 'Great job! Almost perfect.'
            : finalScore >= 5
            ? 'Not bad! Keep practicing.'
            : 'Keep learning and come back stronger!'}
        </p>
        {isPending || isConfirming ? (
          <p className="text-indigo-400 text-sm">Saving your score onchain...</p>
        ) : (
          <p className="text-green-400 text-sm">Score saved onchain!</p>
        )}
        <div className="flex gap-3 justify-center">
          <a href="/profile" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            View Profile
          </a>
          <a href="/leaderboard" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
            Leaderboard
          </a>
        </div>
      </div>
    )
  }

  // Playing phase
  const question = questions[currentIndex]
  if (!question) return null

  const progress = ((currentIndex) / questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{question.category.toUpperCase()}</span>
          <span>{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-lg font-medium leading-relaxed">{question.question}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(question.options).map(([key, value]) => {
          let style = 'bg-gray-900 border-gray-700 hover:border-indigo-500 hover:bg-gray-800'

          if (showResult && selectedAnswer) {
            if (key === selectedAnswer) {
              // Seçilen cevap
              // Doğru/yanlış bilgisi proof'tan geliyor ama burada lokal gösterim için
              // basit renklendirme yapıyoruz, gerçek doğrulama contract'ta
              style = 'bg-gray-800 border-gray-600'
            }
          }

          return (
            <button
              key={key}
              onClick={() => handleAnswer(key)}
              disabled={!!selectedAnswer}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${style} disabled:cursor-not-allowed`}
            >
              <span className="text-indigo-400 font-bold mr-3">{key}</span>
              <span className="text-gray-200">{value}</span>
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
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  )
}
