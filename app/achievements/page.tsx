'use client'

import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useReadContract } from 'wagmi'
import { ACHIEVEMENT_ABI } from '../config/abi'
import { useState, useEffect } from 'react'
import { arcTestnet, CONTRACTS } from '../config/chains'

const CRITERIA_LABELS = ['Total Score', 'Streak Days', 'Games Played', 'Perfect Scores']
const ARC_ACHIEVEMENT_MANAGER = CONTRACTS[arcTestnet.id].achievementManager as `0x${string}`

export default function AchievementsPage() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  // Read achievement list directly from ARC Testnet contract so it is visible on all chains
  const { data: allAchievements } = useReadContract({
    address: ARC_ACHIEVEMENT_MANAGER,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getAllAchievements',
    chainId: arcTestnet.id,
  })

  // Read player achievements directly from ARC Testnet contract
  const { data: playerData, refetch } = useReadContract({
    address: ARC_ACHIEVEMENT_MANAGER,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getPlayerAchievements',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!address },
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isSuccess) refetch()
  }, [isSuccess])

  const handleMint = async (index: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    // Switch to ARC Testnet if not currently connected
    if (currentChainId !== arcTestnet.id) {
      try {
        await switchChainAsync({ chainId: arcTestnet.id })
      } catch (err) {
        console.error('Failed to switch to ARC Testnet for minting:', err)
        return
      }
    }

    writeContract({
      address: ARC_ACHIEVEMENT_MANAGER,
      abi: ACHIEVEMENT_ABI,
      functionName: 'mintAchievementBadge',
      args: [index],
      chainId: arcTestnet.id,
    })
  }

  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="Connect your wallet to view achievements." />
  }

  const unlocked = playerData?.[0] ?? []
  const minted = playerData?.[1] ?? []
  const unlockedCount = unlocked.filter(Boolean).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Achievements
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Unlock achievements across all networks and mint badge NFTs on ARC Network.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-900/60">
          🏆 {unlockedCount} / {allAchievements?.length ?? 0} Unlocked
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {allAchievements?.map((ach, i) => {
          const isUnlocked = unlocked[i] ?? false
          const isMinted = minted[i] ?? false

          return (
            <div
              key={i}
              className={`bg-gray-900/60 border rounded-2xl p-5 space-y-3 backdrop-blur-sm transition-all ${
                isUnlocked ? 'border-indigo-500/60 shadow-lg shadow-indigo-500/5' : 'border-gray-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white flex items-center gap-2 text-base">
                    {isUnlocked ? '✅' : '🔒'} {ach.name}
                  </p>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">{ach.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1">
                <span>Criteria: {CRITERIA_LABELS[ach.criteriaType]}</span>
                <span className="font-bold text-gray-300">{ach.criteriaValue.toString()}</span>
              </div>

              {isUnlocked && !isMinted && (
                <button
                  onClick={() => handleMint(i)}
                  disabled={isPending || isConfirming}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {isPending || isConfirming ? 'Minting Badge...' : 'Mint Badge NFT (on ARC)'}
                </button>
              )}

              {isMinted && (
                <div className="text-center py-1 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-xl text-xs font-bold">
                  ✓ Badge NFT Minted on ARC
                </div>
              )}
            </div>
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
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  )
}
