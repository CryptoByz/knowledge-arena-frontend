'use client'

import { useState, useEffect } from 'react'
import { API_URL } from '../config/chains'

type Question = {
  id: string
  text: string
  options: string[]
  answer: string
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
  status?: 'approved' | 'pending_approval' | 'rejected'
  submittedBy?: string
  paymentTxHash?: string
  paidAmount?: string
  questions: Question[]
}

const CHAINS = [
  { id: 5042002, name: 'ARC Testnet', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 8453, name: 'Base Mainnet', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 84532, name: 'Base Sepolia', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 42220, name: 'Celo Mainnet', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
]

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingChallenge, setEditingChallenge] = useState<Partial<Challenge> | null>(null)

  useEffect(() => {
    const savedSecret = localStorage.getItem('admin_secret')
    if (savedSecret) {
      setAdminSecret(savedSecret)
      verifyAndFetch(savedSecret)
    }
  }, [])

  const verifyAndFetch = async (secret: string) => {
    setLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/challenges`, {
        headers: { 'x-admin-secret': secret }
      })
      if (!res.ok) {
        throw new Error('Geçersiz Admin Şifresi veya yetkisiz erişim!')
      }
      const data = await res.json()
      setChallenges(data)
      setIsAuthenticated(true)
      localStorage.setItem('admin_secret', secret)
    } catch (err: any) {
      setIsAuthenticated(false)
      setAuthError(err.message || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminSecret) return
    verifyAndFetch(adminSecret)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_secret')
    setIsAuthenticated(false)
    setAdminSecret('')
    setChallenges([])
  }

  const fetchChallenges = async () => {
    if (!adminSecret) return
    try {
      const res = await fetch(`${API_URL}/api/admin/challenges`, {
        headers: { 'x-admin-secret': adminSecret }
      })
      if (res.ok) {
        const data = await res.json()
        setChallenges(data)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  const handleToggleActive = async (challenge: Challenge) => {
    try {
      const updated = { ...challenge, isActive: !challenge.isActive }
      const res = await fetch(`${API_URL}/api/admin/challenges/${challenge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({ isActive: updated.isActive })
      })
      if (!res.ok) throw new Error('Güncelleme başarısız')
      setMessage({ type: 'success', text: `Challenge statusupdated: ${updated.isActive ? 'Active' : 'Inactive'}` })
      fetchChallenges()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`'${id}' id'li özel quiz'i silmek istediğinize emin misiniz?`)) return
    try {
      const res = await fetch(`${API_URL}/api/admin/challenges/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': adminSecret }
      })
      if (!res.ok) throw new Error('Silme işlemi başarısız')
      setMessage({ type: 'success', text: 'Özel quiz başarıyla silindi' })
      fetchChallenges()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/challenges/${id}/approve`, {
        method: 'POST',
        headers: { 'x-admin-secret': adminSecret }
      })
      if (!res.ok) throw new Error('Onaylama başarısız oldu')
      setMessage({ type: 'success', text: 'Quiz onaylandı ve canlıya alındı!' })
      fetchChallenges()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Bu quizi reddetmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/challenges/${id}/reject`, {
        method: 'POST',
        headers: { 'x-admin-secret': adminSecret }
      })
      if (!res.ok) throw new Error('Reddetme başarısız oldu')
      setMessage({ type: 'success', text: 'Quiz reddedildi.' })
      fetchChallenges()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const openCreateModal = () => {
    const nowSec = Math.floor(Date.now() / 1000)
    setEditingChallenge({
      id: `challenge-${Date.now().toString().slice(-4)}`,
      title: '',
      description: '',
      chainId: 8453,
      rewardPool: '100 USDC',
      startTimestamp: nowSec,
      endTimestamp: nowSec + (7 * 24 * 3600),
      isActive: true,
      questions: [
        {
          id: `q1`,
          text: '',
          options: ['', '', '', ''],
          answer: ''
        }
      ]
    })
    setIsModalOpen(true)
  }

  const openEditModal = (challenge: Challenge) => {
    setEditingChallenge(JSON.parse(JSON.stringify(challenge)))
    setIsModalOpen(true)
  }

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingChallenge || !editingChallenge.id || !editingChallenge.title) return

    const isEdit = challenges.some(c => c.id === editingChallenge.id)
    const method = isEdit ? 'PUT' : 'POST'
    const endpoint = isEdit 
      ? `${API_URL}/api/admin/challenges/${editingChallenge.id}`
      : `${API_URL}/api/admin/challenges`

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify(editingChallenge)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Kaydetme başarısız')
      }

      setMessage({ type: 'success', text: `Özel Quiz başarıyla ${isEdit ? 'güncellendi' : 'oluşturuldu'}!` })
      setIsModalOpen(false)
      setEditingChallenge(null)
      fetchChallenges()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  // Question Helpers inside Modal
  const addQuestion = () => {
    if (!editingChallenge) return
    const qList = editingChallenge.questions || []
    const newQ: Question = {
      id: `q${qList.length + 1}`,
      text: '',
      options: ['', '', '', ''],
      answer: ''
    }
    setEditingChallenge({ ...editingChallenge, questions: [...qList, newQ] })
  }

  const removeQuestion = (index: number) => {
    if (!editingChallenge || !editingChallenge.questions) return
    const qList = [...editingChallenge.questions]
    qList.splice(index, 1)
    setEditingChallenge({ ...editingChallenge, questions: qList })
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    if (!editingChallenge || !editingChallenge.questions) return
    const qList = [...editingChallenge.questions]
    qList[index] = { ...qList[index], [field]: value }
    setEditingChallenge({ ...editingChallenge, questions: qList })
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    if (!editingChallenge || !editingChallenge.questions) return
    const qList = [...editingChallenge.questions]
    const opts = [...qList[qIndex].options]
    opts[optIndex] = value
    qList[qIndex].options = opts
    setEditingChallenge({ ...editingChallenge, questions: qList })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Paneli</h1>
            <p className="text-sm text-gray-400">Knowledge Arena Özel Quiz Yönetimi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Admin Anahtarı / Şifre</label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Admin secret girin..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {authError && (
              <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-xs p-3 rounded-xl">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const totalQuestionsCount = challenges.reduce((acc, c) => acc + (c.questions?.length || c.questionsCount || 0), 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Özel Quiz Admin Paneli
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Active</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Özel quiz yarışmaları (challenges) oluşturun ve yönetin.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Özel Quiz Oluştur
          </button>

          <button
            onClick={handleLogout}
            className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl border border-gray-800 text-sm transition-colors cursor-pointer"
          >
            Çıkış
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60' : 'bg-red-950/40 text-red-400 border-red-900/60'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Toplam Challenge</div>
          <div className="text-2xl font-bold text-white">{challenges.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Aktif Yarışmalar</div>
          <div className="text-2xl font-bold text-emerald-400">{challenges.filter(c => c.isActive).length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Onay Bekleyenler (250$)</div>
          <div className="text-2xl font-bold text-amber-300">{challenges.filter(c => c.status === 'pending_approval').length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Toplam Soru Sayısı</div>
          <div className="text-2xl font-bold text-indigo-400">{totalQuestionsCount}</div>
        </div>
      </div>

      {/* Challenge List Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Özel Quiz Listesi</h2>
          <button onClick={fetchChallenges} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </div>

        {challenges.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Henüz oluşturulmuş özel bir quiz bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6">Quiz Başlığı & ID</th>
                  <th className="py-3.5 px-4">Ağ (Chain)</th>
                  <th className="py-3.5 px-4">Ödül Havuzu / Ödeme</th>
                  <th className="py-3.5 px-4">Sorular</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {challenges.map((ch) => {
                  const chainInfo = CHAINS.find(c => c.id === ch.chainId) || { name: `Chain ${ch.chainId}`, color: 'bg-gray-800 text-gray-300 border-gray-700' }
                  const qCount = ch.questions?.length || ch.questionsCount || 0
                  const isPendingApproval = ch.status === 'pending_approval'

                  return (
                    <tr key={ch.id} className={`transition-colors ${isPendingApproval ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-gray-800/30'}`}>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {ch.title}
                          {isPendingApproval && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-gray-950 animate-pulse">
                              ⏳ 250$ Onay Bekliyor
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{ch.id}</div>
                        {ch.paymentTxHash && (
                          <div className="text-[11px] text-indigo-400 font-mono mt-1 truncate max-w-xs">
                            Tx: {ch.paymentTxHash.slice(0, 10)}...{ch.paymentTxHash.slice(-8)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-lg border font-medium ${chainInfo.color}`}>
                          {chainInfo.name}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-gray-300 font-medium">
                        <div>{ch.rewardPool || '-'}</div>
                        {ch.paidAmount && <div className="text-xs text-amber-400 font-bold mt-0.5">✓ {ch.paidAmount}</div>}
                      </td>

                      <td className="py-4 px-4 text-gray-400">
                        <span className="font-mono bg-gray-950 px-2 py-1 rounded border border-gray-800 text-xs">
                          {qCount} Soru
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {isPendingApproval ? (
                          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border bg-amber-950/60 text-amber-300 border-amber-900/80 font-bold">
                            ⏳ Onay Bekliyor
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(ch)}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border cursor-pointer transition-all ${
                              ch.isActive 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80 hover:bg-emerald-900/40' 
                                : 'bg-gray-950 text-gray-500 border-gray-800 hover:text-gray-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${ch.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                            {ch.isActive ? 'Aktif' : 'Pasif'}
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPendingApproval ? (
                            <>
                              <button
                                onClick={() => handleApprove(ch.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                              >
                                ✓ Onayla
                              </button>
                              <button
                                onClick={() => handleReject(ch.id)}
                                className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-900/60 font-bold text-xs rounded-lg transition-all cursor-pointer"
                              >
                                ✕ Reddet
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(ch)}
                                className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => handleDelete(ch.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingChallenge && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl my-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">
                {challenges.some(c => c.id === editingChallenge.id) ? 'Özel Quiz Düzenle' : 'Yeni Özel Quiz Oluştur'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveChallenge} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Challenge ID (Benzersiz Slug)</label>
                  <input
                    type="text"
                    required
                    value={editingChallenge.id || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, id: e.target.value })}
                    placeholder="örneğin: celo-summer-challenge"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Ağ (Chain)</label>
                  <select
                    value={editingChallenge.chainId || 8453}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, chainId: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {CHAINS.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Quiz Başlığı</label>
                <input
                  type="text"
                  required
                  value={editingChallenge.title || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                  placeholder="örneğin: Base Ecosystem Reward Quiz"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={editingChallenge.description || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                  placeholder="Yarışma detayları ve kuralları..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Ödül Havuzu Metni</label>
                  <input
                    type="text"
                    value={editingChallenge.rewardPool || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, rewardPool: e.target.value })}
                    placeholder="örneğin: 500 USDC"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingChallenge.isActive ?? true}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, isActive: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="text-sm font-semibold text-white">Yarışma Aktif Edilsin mi?</span>
                  </label>
                </div>
              </div>

              {/* DYNAMIC QUESTIONS SECTION */}
              <div className="border-t border-gray-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-bold text-white">Sorular ve Cevaplar ({editingChallenge.questions?.length || 0})</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    + Soru Ekle
                  </button>
                </div>

                <div className="space-y-6">
                  {editingChallenge.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="bg-gray-950 border border-gray-800 rounded-xl p-4 relative">
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-amber-400 font-semibold">Soru #{qIdx + 1} ({q.id || `q${qIdx+1}`})</span>
                        {editingChallenge.questions!.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Soruyu Sil
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Soru metni..."
                            value={q.text || ''}
                            onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* 4 Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                            <div key={letter} className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-500 w-4">{letter}:</span>
                              <input
                                type="text"
                                required
                                placeholder={`Seçenek ${letter}...`}
                                value={q.options?.[optIdx] || ''}
                                onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Correct Answer Selector */}
                        <div className="pt-2 flex items-center gap-3">
                          <label className="text-xs font-semibold text-emerald-400">Doğru Cevap:</label>
                          <select
                            value={q.answer || ''}
                            onChange={(e) => updateQuestion(qIdx, 'answer', e.target.value)}
                            required
                            className="bg-gray-900 border border-gray-800 text-xs text-emerald-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Doğru seçeneği seçin...</option>
                            {q.options?.map((opt, i) => opt ? (
                              <option key={i} value={opt}>Seçenek {['A','B','C','D'][i]}: {opt}</option>
                            ) : null)}
                          </select>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3 sticky bottom-0 bg-gray-900 pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-800 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  Quiz'i Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
