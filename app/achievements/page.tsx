'use client'

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useReadContract } from 'wagmi'
import { useChainConfig } from '../hooks/useChainConfig'
import { ACHIEVEMENT_ABI } from '../config/abi'
import { useState, useEffect } from 'react'

const CRITERIA_LABELS = ['Total Score', 'Streak Days', 'Games Played', 'Perfect Scores']

export default function AchievementsPage() {
  const { address, isConnected } = useAccount()
  const { contracts, isSupported } = useChainConfig()

  const { data: allAchievements } = useReadContract({
    address: contracts?.achievementManager as `0x${string}`,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getAllAchievements',
    query: { enabled: !!contracts },
  })

  const { data: playerData, refetch } = useReadContract({
    address: contracts?.achievementManager as `0x${string}`,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getPlayerAchievements',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

useEffect(() => {
    if (isSuccess) refetch()
  }, [isSuccess]) 

  const handleMint = (index: number) => {
    if (!contracts) return
    writeContract({
      address: contracts.achievementManager as `0x${string}`,
      abi: ACHIEVEMENT_ABI,
      functionName: 'mintAchievementBadge',
      args: [index],
    })
  }

  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="Connect your wallet to view achievements." />
  }

  if (!isSupported) {
    return <CenteredMessage title="Wrong network" subtitle="Switch to ARC Testnet or Base Sepolia." />
  }

  const unlocked = playerData?.[0] ?? []
  const minted = playerData?.[1] ?? []
  const unlockedCount = unlocked.filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <span className="text-sm text-gray-400">
          {unlockedCount} / {allAchievements?.length ?? 0} unlocked
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {allAchievements?.map((ach, i) => {
          const isUnlocked = unlocked[i] ?? false
          const isMinted = minted[i] ?? false

          return (
            <div
              key={i}
              className={`bg-gray-900 border rounded-xl p-5 space-y-3 transition-colors ${
                isUnlocked ? 'border-indigo-700' : 'border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white flex items-center gap-2">
                    {isUnlocked ? '✅' : '🔒'} {ach.name}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{ach.description}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {CRITERIA_LABELS[ach.criteriaType]}: {ach.criteriaValue.toString()}
              </p>

              {isUnlocked && !isMinted && (
                <button
                  onClick={() => handleMint(i)}
                  disabled={isPending || isConfirming}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {isPending || isConfirming ? 'Minting...' : 'Mint Badge NFT'}
                </button>
              )}

              {isMinted && (
                <p className="text-center text-sm text-green-400">Badge minted ✓</p>
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
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  )
}
