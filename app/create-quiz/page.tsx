'use client'

import { useState } from 'react'
import { useAccount, useChainId, useSwitchChain, useSendTransaction } from 'wagmi'
import { parseUnits } from 'viem'
import { API_URL, arcTestnet } from '../config/chains'
import { useLanguage } from '../context/LanguageContext'
import { getTranslation } from '../config/translations'

type QuestionItem = {
  id: string
  text: string
  options: string[]
  answer: string
}

const TREASURY_ADDRESS = '0xb98C170Ee93365A19928059a71c23629897150F9'

export default function CreateQuizPage() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { language } = useLanguage()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rewardPool, setRewardPool] = useState('100 USDC')
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: 'q1',
      text: '',
      options: ['', '', '', ''],
      answer: '',
    },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showAgentDocs, setShowAgentDocs] = useState(false)

  const { sendTransactionAsync, isPending: isTxPending } = useSendTransaction()

  // Question editing handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q${questions.length + 1}`,
        text: '',
        options: ['', '', '', ''],
        answer: '',
      },
    ])
  }

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length === 1) return
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions]
    updated[idx].text = text
    setQuestions(updated)
  }

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions]
    updated[qIdx].options[optIdx] = val
    // If answer was set to old value, update it
    if (updated[qIdx].answer === updated[qIdx].options[optIdx]) {
      updated[qIdx].answer = val
    }
    setQuestions(updated)
  }

  const handleAnswerSelect = (qIdx: number, val: string) => {
    const updated = [...questions]
    updated[qIdx].answer = val
    setQuestions(updated)
  }

  // Validation
  const validateForm = () => {
    if (!title.trim() || !description.trim()) {
      setError(language === 'tr' ? 'Lütfen Quiz Başlığı ve Açıklamasını doldurun.' : 'Please fill in the Quiz Title and Description.')
      return false
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        setError(language === 'tr' ? `${i + 1}. sorunun metni boş olamaz.` : `Question ${i + 1} text cannot be empty.`)
        return false
      }
      if (q.options.some(opt => !opt.trim())) {
        setError(language === 'tr' ? `${i + 1}. sorunun tüm 4 şıkkı doldurulmalıdır.` : `All 4 options for Question ${i + 1} must be filled.`)
        return false
      }
      if (!q.answer.trim()) {
        setError(language === 'tr' ? `${i + 1}. soru için doğru cevap seçilmelidir.` : `A correct answer must be selected for Question ${i + 1}.`)
        return false
      }
    }
    setError(null)
    return true
  }

  const handleGoToPayment = () => {
    if (validateForm()) {
      setStep(2)
    }
  }

  // Payment Execution on ARC Network
  const handlePayAndSubmit = async () => {
    if (!isConnected) {
      alert(language === 'tr' ? 'Lütfen öncelikle cüzdanınızı bağlayın!' : 'Please connect your wallet first!')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      // 1. Ensure connected to ARC Network
      if (currentChainId !== arcTestnet.id) {
        await switchChainAsync({ chainId: arcTestnet.id })
      }

      // 2. Execute 100 USDC Payment on ARC Network to Treasury Address
      // USDC on ARC Testnet has 6 decimals -> 100 * 10^6
      const hash = await sendTransactionAsync({
        to: TREASURY_ADDRESS as `0x${string}`,
        value: parseUnits('100', 6),
      })

      setTxHash(hash)

      // 3. Submit Quiz Proposal to Backend
      const res = await fetch(`${API_URL}/api/challenges/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          rewardPool,
          chainId: arcTestnet.id,
          submittedBy: address,
          paymentTxHash: hash,
          questions,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (language === 'tr' ? 'Quiz gönderimi başarısız oldu.' : 'Quiz submission failed.'))
      }

      setSuccessMsg(data.message)
      setStep(3)
    } catch (err: any) {
      console.error(err)
      setError(err.message || (language === 'tr' ? 'İşlem sırasında bir hata oluştu.' : 'An error occurred during transaction.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title Header */}
      <div className="border-b border-gray-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-yellow-200 to-white bg-clip-text text-transparent flex items-center gap-2">
            ⚡ {language === 'tr' ? 'Özel Quiz Oluştur & Yayınla' : 'Create & Publish Special Quiz'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'tr'
              ? 'Kendi özel yarışmanızı oluşturun. 100$ USDC ödeme ile onay sürecine gönderin.'
              : 'Create your own custom competition. Submit it for review with a $100 USDC payment.'}
          </p>
        </div>

        <button
          onClick={() => setShowAgentDocs(!showAgentDocs)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-950/60 text-indigo-400 border border-indigo-900/60 hover:bg-indigo-900/40 transition-all cursor-pointer flex items-center gap-1.5 w-fit"
        >
          🤖 {language === 'tr' ? 'AI Agent & Geliştirici API' : 'AI Agent & Developer API'}
        </button>
      </div>

      {/* AI Agent Documentation Drawer */}
      {showAgentDocs && (
        <div className="bg-indigo-950/30 border border-indigo-900/60 rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
              🤖 {language === 'tr' ? 'AI Agent & Otonom Sistem Entegrasyon Rehberi' : 'AI Agent & Autonomous System Integration Guide'}
            </h3>
            <span className="text-xs bg-indigo-900/60 text-indigo-200 px-2.5 py-1 rounded-lg font-mono">
              ARC App Kit Enabled
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {language === 'tr'
              ? "AI Agent'lar ve geliştiriciler, web arayüzünü kullanmadan programlı olarak da 100$ USDC ödemesini gönderip kendi quizlerini otomatik olarak yayınlatabilirler."
              : 'AI Agents and developers can also automatically publish their quizzes programmatically by submitting the $100 USDC payment and sending payload to the API directly.'}
          </p>

          <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-2 overflow-x-auto border border-gray-800">
            <div className="text-amber-400 font-bold"># Step 1: Transfer 100 USDC on ARC Network (ChainID: 5042002)</div>
            <div>Treasury Address: <span className="text-emerald-400 font-bold">{TREASURY_ADDRESS}</span></div>
            <div className="text-amber-400 font-bold pt-2"># Step 2: POST JSON Payload to Submission API</div>
            <div>URL: <span className="text-indigo-400">{API_URL}/api/challenges/submit</span></div>
            <pre className="text-gray-400 pt-1">
{`{
  "title": "My AI Agent Challenge",
  "description": "Hosted by Autonomous Agent",
  "rewardPool": "500 USDC",
  "submittedBy": "0xYourWalletAddress",
  "paymentTxHash": "0xTransactionHashFromStep1",
  "questions": [
    {
      "id": "q1",
      "text": "What is ARC Network?",
      "options": ["High speed L1", "Sidechain", "Storage", "Privacy coin"],
      "answer": "High speed L1"
    }
  ]
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Progress Steps Indicator */}
      <div className="flex items-center justify-between max-w-lg mx-auto bg-gray-950 border border-gray-800/80 rounded-2xl p-2">
        <div className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${step === 1 ? 'bg-amber-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>
          {language === 'tr' ? '1. Quiz Detayları' : '1. Quiz Details'}
        </div>
        <div className="text-gray-700 font-bold px-2">➔</div>
        <div className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${step === 2 ? 'bg-amber-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>
          {language === 'tr' ? '2. 100$ Ödeme (ARC)' : '2. $100 Payment (ARC)'}
        </div>
        <div className="text-gray-700 font-bold px-2">➔</div>
        <div className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${step === 3 ? 'bg-emerald-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>
          {language === 'tr' ? '3. Onay Bekliyor' : '3. Awaiting Approval'}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-xs text-red-300 font-semibold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* ================= STEP 1: QUIZ DETAILS & QUESTIONS ================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
              📋 {language === 'tr' ? 'Genel Bilgiler' : 'General Info'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">{language === 'tr' ? 'Quiz Başlığı *' : 'Quiz Title *'}</label>
                <input
                  type="text"
                  placeholder={language === 'tr' ? 'Örn: ARC Ecosystem Master Challenge' : 'e.g. ARC Ecosystem Master Challenge'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">{language === 'tr' ? 'Ödül Havuzu Etiketi' : 'Reward Pool Tag'}</label>
                <input
                  type="text"
                  placeholder={language === 'tr' ? 'Örn: 500 USDC veya NFT Badges' : 'e.g. 500 USDC or NFT Badges'}
                  value={rewardPool}
                  onChange={(e) => setRewardPool(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">{language === 'tr' ? 'Quiz Açıklaması *' : 'Quiz Description *'}</label>
              <textarea
                rows={3}
                placeholder={language === 'tr' ? 'Katılımcılara yarışma hakkında bilgi verin...' : 'Give participants some information about the competition...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Dynamic Questions Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ❓ {language === 'tr' ? `Quiz Soruları (${questions.length} Soru)` : `Quiz Questions (${questions.length} Questions)`}
              </h2>
              <button
                onClick={handleAddQuestion}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                + {language === 'tr' ? 'Yeni Soru Ekle' : 'Add New Question'}
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id} className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-sm relative">
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {language === 'tr' ? `Soru #${qIdx + 1}` : `Question #${qIdx + 1}`}
                  </span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      {language === 'tr' ? 'Sil' : 'Delete'}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">{language === 'tr' ? 'Soru Metni *' : 'Question Text *'}</label>
                  <input
                    type="text"
                    placeholder={language === 'tr' ? 'Soru metnini girin...' : 'Enter question text...'}
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Options Grid */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">{language === 'tr' ? 'Şıklar & Doğru Cevap *' : 'Options & Correct Answer *'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                      <div key={letter} className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-xl p-2">
                        <span className="w-6 h-6 rounded-lg bg-gray-900 text-gray-300 font-bold text-xs flex items-center justify-center">
                          {letter}
                        </span>
                        <input
                          type="text"
                          placeholder={language === 'tr' ? `Şık ${letter}` : `Option ${letter}`}
                          value={q.options[optIdx]}
                          onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          className="w-full bg-transparent text-white text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleAnswerSelect(qIdx, q.options[optIdx])}
                          title={language === 'tr' ? 'Doğru cevap olarak seç' : 'Select as correct answer'}
                          disabled={!q.options[optIdx].trim()}
                          className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            q.answer && q.answer === q.options[optIdx]
                              ? 'bg-emerald-500 text-gray-950'
                              : 'bg-gray-900 text-gray-500 hover:text-white'
                          }`}
                        >
                          {q.answer && q.answer === q.options[optIdx] 
                            ? (language === 'tr' ? '✓ Doğru' : '✓ Correct') 
                            : (language === 'tr' ? 'Seç' : 'Select')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleGoToPayment}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-950 font-black text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {language === 'tr' ? 'Devam Et: Ödeme Adımı ➔' : 'Continue: Payment Step ➔'}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PAYMENT (100 USDC ON ARC) ================= */}
      {step === 2 && (
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-8 space-y-6 shadow-xl backdrop-blur-sm max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-3xl flex items-center justify-center mx-auto animate-pulse">
            💎
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">{language === 'tr' ? 'Yayınlama Ücreti Ödemesi' : 'Publishing Fee Payment'}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {language === 'tr'
                ? 'Quizinizin platformda yayınlanması ve onay sürecine girmesi için sabit ücret ödenmelidir.'
                : 'A flat fee must be paid to submit your quiz for approval and publish it on the platform.'}
            </p>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{language === 'tr' ? 'Sabit Quiz Yayınlama Ücreti' : 'Flat Quiz Publishing Fee'}</span>
              <span className="font-extrabold text-amber-400 text-lg">100 USDC</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-gray-850 pt-3">
              <span className="text-gray-400">{language === 'tr' ? 'Ödeme Ağı' : 'Payment Network'}</span>
              <span className="font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-900/60 px-2.5 py-1 rounded-lg text-xs">
                ARC Network (ChainID: 5042002)
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={handlePayAndSubmit}
              disabled={isSubmitting || isTxPending}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-gray-950 font-black text-base rounded-xl transition-all cursor-pointer shadow-xl shadow-amber-500/20"
            >
              {isSubmitting || isTxPending 
                ? (language === 'tr' ? '100 USDC Ödemesi Gönderiliyor...' : 'Sending 100 USDC Payment...') 
                : (language === 'tr' ? 'Ödemeyi Yap & Gönder (100 USDC)' : 'Submit & Pay (100 USDC)')}
            </button>

            <button
              onClick={() => setStep(1)}
              disabled={isSubmitting || isTxPending}
              className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              {language === 'tr' ? '← Quiz Bilgilerini Düzenlemeye Dön' : '← Back to Edit Quiz Details'}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: SUBMITTED & PENDING APPROVAL ================= */}
      {step === 3 && (
        <div className="bg-gray-900/60 border border-emerald-900/50 rounded-2xl p-10 space-y-6 shadow-2xl backdrop-blur-sm max-w-xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-4xl flex items-center justify-center mx-auto text-emerald-400">
            ✓
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">{language === 'tr' ? 'Quiz Başarıyla Alındı!' : 'Quiz Successfully Received!'}</h2>
            <p className="text-emerald-400/90 text-sm mt-2 leading-relaxed font-semibold">
              {language === 'tr'
                ? '100 USDC ödemeniz onaylandı ve quiziniz yönetici onayına gönderildi.'
                : 'Your 100 USDC payment has been confirmed and your quiz has been submitted for admin approval.'}
            </p>
          </div>

          {txHash && (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-400 truncate">
              {language === 'tr' ? 'Ödeme İşlem Kodu (TxHash):' : 'Payment Transaction Hash (TxHash):'} <span className="text-gray-200">{txHash}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 leading-relaxed">
            {language === 'tr'
              ? 'Yöneticilerimiz quiz metnini ve şıklarını inceleyerek kısa süre içerisinde onaylayacaktır. Onaylandığı anda etkinliğiniz Knowledge Arena anasayfasında ve özel etkinlikler listesinde canlıya geçecektir!'
              : 'Our administrators will review the quiz text and options shortly. Once approved, your competition will go live on the Knowledge Arena homepage and special events list!'}
          </p>

          <div className="pt-4">
            <a
              href="/leaderboard"
              className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {language === 'tr' ? 'Sıralama Tablosuna Git' : 'Go to Leaderboard'}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
