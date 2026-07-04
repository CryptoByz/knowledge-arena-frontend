'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { useChainConfig } from '../hooks/useChainConfig'
import { useQuizState } from '../hooks/useQuizState'
import { DAILY_QUIZ_ABI } from '../config/abi'
import { API_URL, arcTestnet, baseMainnet, celo } from '../config/chains'
import { useLanguage } from '../context/LanguageContext'
import { getTranslation } from '../config/translations'
import translatedQuestions from '../config/translatedQuestions.json'
import translatedChallenges from '../config/translatedChallenges.json'

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
  const { language } = useLanguage()
  const { canPlay, isTodayReady, hasSubmitted, todayScore, hasEnteredToday } = useQuizState(address)

  const [mounted, setMounted] = useState(false)
  const [tag, setTag] = useState('general')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
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
      const cId = params.get('challengeId')
      setTag(t)
      if (cId) setChallengeId(cId)
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
      value = 100000000000000000n; // 0.1 CELO (native, 18 decimals)
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
      let url = `${API_URL}/api/daily-questions?tag=${tag}&chainId=${chainId}`
      if (challengeId) {
        url = `${API_URL}/api/challenges/${challengeId}`
      }
      const res = await fetch(url)
      const data = await res.json()

      const rawQuestions = data.questions || []
      const normalized = rawQuestions.map((q: any, idx: number) => {
        let opts = q.options
        if (Array.isArray(opts)) {
          opts = {
            A: opts[0] || '',
            B: opts[1] || '',
            C: opts[2] || '',
            D: opts[3] || '',
          }
        }
        return {
          index: idx,
          id: q.id || `q${idx+1}`,
          category: q.category || (challengeId ? 'Special Challenge' : 'General Trivia'),
          difficulty: q.difficulty || 'medium',
          question: q.question || q.text || '',
          options: opts || { A:'', B:'', C:'', D:'' }
        }
      })

      setQuestions(normalized)
      setStartTime(Date.now())
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
      let proofUrl = `${API_URL}/api/proof`
      let bodyData: any = {
        chainId,
        tag,
        answers: ['A', 'B', 'C', 'D'].map(opt => ({
          questionIndex: currentIndex,
          answer: opt,
        })),
      }

      if (challengeId && questions[currentIndex]) {
        proofUrl = `${API_URL}/api/challenges/${challengeId}/proof`
        bodyData = {
          answers: ['A', 'B', 'C', 'D'].map(opt => ({
            questionId: questions[currentIndex].id,
            answer: opt,
          }))
        }
      }

      // Get proof and correctness for all 4 options to display the right selection
      const res = await fetch(proofUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
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
      let proofUrl = `${API_URL}/api/proof`
      let bodyData: any = {
        chainId,
        tag,
        answers: questions.map((q, i) => ({
          questionIndex: i,
          answer: finalAnswers[i],
        })),
      }

      const durationSeconds = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 30

      if (challengeId) {
        proofUrl = `${API_URL}/api/challenges/${challengeId}/proof`
        bodyData = {
          playerAddress: address,
          durationSeconds,
          answers: questions.map((q, i) => ({
            questionId: q.id,
            answer: finalAnswers[i],
          }))
        }
      }

      const res = await fetch(proofUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })
      const data = await res.json()

      const answerHashes = data.proofs.map((p: any) => p.answerHash as `0x${string}`)
      const proofs = data.proofs.map((p: any) => p.proof as `0x${string}`[])

      const score = data.proofs.filter((p: any) => p.isCorrect).length
      setFinalScore(score)

      if (isDemoMode || challengeId) {
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
    const tweetText = `I just scored ${todayScore}/10 on the ${networkName} Daily Quiz at Knowledge Arena! 🧠\n\nJoin the arena: https://knowledge-arena.xyz/`
    const xShareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

    return (
      <div className="max-w-lg mx-auto text-center space-y-8 pt-8">
        <div className="space-y-3">
          <div className="text-6xl animate-bounce">👍</div>
          <h1 className="text-3xl font-black text-white">Daily Quiz Completed</h1>
          <p className="text-gray-400 max-w-sm mx-auto text-sm">
            You have already played today's {networkName} daily quiz. Come back tomorrow for a new set of challenges!
          </p>
        </div>

        {/* Visual Card Preview */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 shadow-2xl backdrop-blur-sm transition-all duration-300">
            <img
              src={`/api/og?score=${todayScore}&chain=${tag}`}
              alt="Score Card"
              className="w-full h-auto block select-all cursor-pointer rounded-3xl"
            />
          </div>
          <p className="text-xs text-gray-500/85 italic text-center">
            💡 Tip: Right-click the card above, select \"Copy Image\", and paste it directly into your X post!
          </p>
        </div>

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

  if (phase === 'enter') {
    const networkNames: Record<string, string> = {
      arc: 'ARC',
      base: 'Base',
      celo: 'Celo',
      general: language === 'tr' ? 'Genel' : 'General',
    };
    const networkName = networkNames[tag] || tag.toUpperCase();

    const feeDisplays: Record<string, string> = {
      arc: '2.00 USDC',
      celo: '0.10 CELO',
      base: '0.0003 ETH',
      general: '0.0003 ETH',
    };
    const feeText = feeDisplays[tag] || '0.00 USDC';

    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          {getTranslation('dailyQuizTitle', language).replace('{network}', networkName)}
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          {tag === 'general'
            ? getTranslation('generalQuizDescLabel', language)
            : getTranslation('quizDesc', language).replace('{network}', networkName)}
        </p>
        
        {isDemoMode && (
          <div className="px-4 py-2.5 text-xs bg-amber-950/40 border border-amber-900/60 text-amber-400 rounded-xl leading-relaxed">
            ⚠️ {getTranslation('demoModeWarning', language)}
          </div>
        )}

        {hasEnteredToday && !isDemoMode && (
          <div className="px-4 py-2.5 text-xs bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 rounded-xl leading-relaxed">
            {getTranslation('alreadyPlayedToday', language)}
          </div>
        )}

        <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl px-4 py-3 flex items-center justify-between text-sm max-w-sm mx-auto">
          <span className="text-gray-400 font-medium">{language === 'tr' ? 'Giriş Ücreti' : 'Entry Fee'}</span>
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
            ? (language === 'tr' ? 'İşlem Onaylanıyor...' : 'Confirming Transaction...')
            : isDemoMode
            ? `${getTranslation('startQuiz', language)} (${language === 'tr' ? 'Demo Modu' : 'Demo Mode'})`
            : hasEnteredToday
            ? getTranslation('startQuiz', language)
            : getTranslation('startQuiz', language)}
        </button>
      </div>
    )
  }

  if (phase === 'approving' || phase === 'entering') {
    return (
      <CenteredMessage
        title={language === 'tr' ? 'Quize Giriş Yapılıyor...' : 'Entering Quiz...'}
        subtitle={language === 'tr' ? 'Lütfen cüzdanınızdan işlemi onaylayın.' : 'Please confirm the entry in your wallet.'}
      />
    )
  }

  if (phase === 'submitting') {
    return (
      <CenteredMessage 
        title={language === 'tr' ? 'Skor Gönderiliyor...' : 'Submitting Answers...'} 
        subtitle={language === 'tr' ? 'Lütfen cüzdanınızdan skor kaydetme işlemini onaylayın.' : 'Please confirm the scoring transaction in your wallet.'} 
      />
    )
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
    const totalQ = questions.length || 10

    // Prefill X share text & url
    const tweetText = `I just scored ${finalScore}/${totalQ} on the ${networkName} Quiz at Knowledge Arena! 🧠\n\nJoin the arena: https://knowledge-arena.xyz/`
    const xShareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

    return (
      <div className="max-w-lg mx-auto text-center space-y-8 pt-8">
        <div className="space-y-3">
          <div className="text-6xl animate-bounce">{finalScore === totalQ ? '🏆' : finalScore >= Math.ceil(totalQ * 0.5) ? '👍' : '📚'}</div>
          <h1 className="text-3xl font-black text-white">
            {finalScore}/{totalQ} {language === 'tr' ? 'Doğru' : 'Correct'}
          </h1>
          <p className="text-gray-400 max-w-sm mx-auto text-sm">
            {finalScore === totalQ
              ? (language === 'tr' ? 'Kusursuz skor! Harika!' : 'Perfect score! Outstanding!')
              : finalScore >= Math.ceil(totalQ * 0.8)
              ? (language === 'tr' ? 'Harika iş! Neredeyse kusursuz.' : 'Great job! Almost flawless.')
              : finalScore >= Math.ceil(totalQ * 0.5)
              ? (language === 'tr' ? 'Tebrikler! İyi bir deneme.' : 'Well done! Solid effort.')
              : (language === 'tr' ? 'Pratik yapmak mükemmelleştirir. Okumaya devam edin ve bir dahaki sefere tekrar deneyin!' : 'Practice makes perfect. Keep reading and come back next time!')}
          </p>
        </div>

        {/* Visual Card Preview */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 shadow-2xl backdrop-blur-sm transition-all duration-300">
            <img
              src={`/api/og?score=${finalScore}&chain=${tag}`}
              alt="Score Card"
              className="w-full h-auto block select-all cursor-pointer rounded-3xl"
            />
          </div>
          <p className="text-xs text-gray-500/85 italic text-center">
            {language === 'tr'
              ? '💡 İpucu: Yukarıdaki karta sağ tıklayıp "Görseli Kopyala" seçeneğini seçin ve doğrudan X gönderinize yapıştırın!'
              : '💡 Tip: Right-click the card above, select "Copy Image", and paste it directly into your X post!'}
          </p>
        </div>

        {/* Verification Status */}
        {isDemoMode ? (
          <p className="text-amber-400 text-xs font-semibold">
            {language === 'tr' ? 'Demo Modunda Oynandı (Skor zincir üstüne kaydedilmedi)' : 'Played in Demo Mode (Score not saved onchain)'}
          </p>
        ) : isPending || isConfirming ? (
          <p className="text-indigo-400 text-xs font-semibold animate-pulse">
            {language === 'tr' ? 'Skor zincir üstüne kaydediliyor...' : 'Saving score onchain...'}
          </p>
        ) : (
          <p className="text-green-400 text-xs font-semibold">
            {language === 'tr' ? '✓ Skor zincir üstünde başarıyla onaylandı!' : '✓ Score successfully committed onchain!'}
          </p>
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
            {getTranslation('shareOnX', language)}
          </a>
          <div className="flex gap-3 w-full sm:w-auto">
            <a href="/profile" className="flex-1 sm:flex-none px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold text-sm rounded-xl transition-all text-center">
              {getTranslation('viewProfileBtn', language)}
            </a>
            <a href="/leaderboard" className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all text-center">
              {getTranslation('leaderboardBtn', language)}
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

  // Translate active question and options if language is TR
  let displayedQuestionText = question.question
  let displayedOptions = { ...question.options }

  if (language === 'tr') {
    if (challengeId) {
      const trChallenge = (translatedChallenges as any)[challengeId]
      if (trChallenge && Array.isArray(trChallenge.questions)) {
        const trQ = trChallenge.questions.find((q: any) => q.id === question.id) || trChallenge.questions[currentIndex]
        if (trQ) {
          displayedQuestionText = trQ.question || trQ.text || displayedQuestionText
          if (Array.isArray(trQ.options)) {
            displayedOptions = {
              A: trQ.options[0] || displayedOptions.A,
              B: trQ.options[1] || displayedOptions.B,
              C: trQ.options[2] || displayedOptions.C,
              D: trQ.options[3] || displayedOptions.D,
            }
          }
        }
      }
    } else {
      const trQ = (translatedQuestions as any)[question.id]
      if (trQ) {
        displayedQuestionText = trQ.question || displayedQuestionText
        if (Array.isArray(trQ.options)) {
          displayedOptions = {
            A: trQ.options[0] || displayedOptions.A,
            B: trQ.options[1] || displayedOptions.B,
            C: trQ.options[2] || displayedOptions.C,
            D: trQ.options[3] || displayedOptions.D,
          }
        }
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress & Category */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400 font-medium">
          <span className="uppercase tracking-wider text-indigo-400">{question.category}</span>
          <span>
            {getTranslation('questionLabel', language)
              .replace('{current}', String(currentIndex + 1))
              .replace('{total}', String(questions.length))}
          </span>
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
        <p className="text-lg font-semibold leading-relaxed text-gray-100">{displayedQuestionText}</p>
      </div>

      {/* Answers List */}
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(displayedOptions).map(([key, value]) => {
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
