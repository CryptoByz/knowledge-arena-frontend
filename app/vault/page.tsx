'use client'

import { useEffect, useState } from 'react'
import { API_URL } from '../config/chains'

interface VaultInfo {
  chainName: string
  tag: string
  chainId: number
  adminWallet: string
  dailyQuizAddress: string
  totalGamesPlayed: string
  entryFee: string
  totalFeesCollected: string
  feeSymbol?: string
  adminUsdcBalance: string
  adminNativeBalance: string
  nativeSymbol: string
  error?: string
}

export default function VaultPage() {
  const [vaults, setVaults] = useState<Record<string, VaultInfo> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVaults() {
      try {
        const res = await fetch(`${API_URL}/api/vault`)
        const data = await res.json()
        if (data.success) {
          setVaults(data.vaults)
        } else {
          setError(data.error || 'Failed to fetch vault data')
        }
      } catch (err: any) {
        console.error('Error fetching vault data:', err)
        setError('Network error loading vault. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchVaults()
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(id)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const networkColors: Record<string, { bg: string, text: string, border: string, glow: string }> = {
    '5042002': { // ARC
      bg: 'from-gray-900 to-indigo-950/15',
      text: 'text-indigo-400',
      border: 'border-indigo-850 hover:border-indigo-500/50',
      glow: 'shadow-indigo-500/5'
    },
    '42220': { // Celo
      bg: 'from-gray-900 to-amber-950/15',
      text: 'text-amber-400',
      border: 'border-amber-850 hover:border-amber-500/50',
      glow: 'shadow-amber-500/5'
    },
    '8453': { // Base Mainnet
      bg: 'from-gray-900 to-blue-950/15',
      text: 'text-blue-400',
      border: 'border-blue-850 hover:border-blue-500/50',
      glow: 'shadow-blue-500/5'
    },
    '84532': { // Base Sepolia
      bg: 'from-gray-900 to-gray-900',
      text: 'text-gray-400',
      border: 'border-gray-800 hover:border-gray-700',
      glow: 'shadow-black/5'
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pt-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
          Knowledge Arena Vault
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto leading-relaxed text-sm">
          Real-time onchain reserves auditing. All entry fees collected from participants are tracked and backed transparently by reserves in our admin wallets.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-72 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-6 w-1/3 bg-gray-800 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
                <div className="h-12 w-full bg-gray-800 rounded-xl"></div>
              </div>
              <div className="h-10 w-full bg-gray-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/50 text-center max-w-md mx-auto space-y-3">
          <p className="text-red-400 font-bold">⚠️ Error Loading Vault</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      ) : vaults ? (
        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(vaults)
            .filter(([id]) => id !== '84532')
            .map(([id, vault]) => {
              const colors = networkColors[id] || {
                bg: 'from-gray-900 to-gray-900',
                text: 'text-white',
                border: 'border-gray-800 hover:border-gray-700',
                glow: 'shadow-black/5'
              }

              return (
                <div
                  key={id}
                  className={`bg-gray-900 border ${colors.border} rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 shadow-xl bg-gradient-to-b ${colors.bg} ${colors.glow}`}
                >
                  <div className="space-y-6">
                    {/* Title & Status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-white">{vault.chainName}</h2>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider bg-green-950/40 text-green-300 border-green-800/80">
                        🟢 Audited
                      </span>
                    </div>

                    {/* Core Metrics */}
                    <div className="space-y-4">
                      <div className="bg-gray-950/60 border border-gray-850 p-6 rounded-xl space-y-2 text-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Reserves Collected</span>
                        <p className="text-3xl font-black text-green-400">
                          {vault.totalFeesCollected} {vault.feeSymbol || 'USDC'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer buttons / links */}
                  <div className="pt-6">
                    <a
                      href={
                        id === '5042002'
                          ? `https://testnet.arcscan.app/address/${vault.adminWallet}`
                          : id === '42220'
                          ? `https://celoscan.io/address/${vault.adminWallet}`
                          : `https://basescan.org/address/${vault.adminWallet}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-2.5 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-950 text-gray-300 hover:text-white text-xs font-bold tracking-wide transition-all block cursor-pointer"
                    >
                      View Wallet on Explorer ↗
                    </a>
                  </div>
                </div>
              )
            })}
        </div>
      ) : null}
    </div>
  )
}
