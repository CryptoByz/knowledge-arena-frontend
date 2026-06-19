'use client'

import { useReadContract } from 'wagmi'
import { useChainConfig } from './useChainConfig'
import { PLAYER_PROFILE_ABI } from '../config/abi'

export function usePlayerProfile(address?: `0x${string}`) {
  const { contracts } = useChainConfig()

  const isDummy = !contracts?.playerProfile || contracts.playerProfile === '0x0000000000000000000000000000000000000000'

  const { data, isLoading, refetch } = useReadContract({
    address: contracts?.playerProfile as `0x${string}`,
    abi: PLAYER_PROFILE_ABI,
    functionName: 'getProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && !isDummy },
  })

  return {
    totalScore:       data?.[0] ?? 0n,
    weeklyScore:      data?.[1] ?? 0n,
    monthlyScore:     data?.[2] ?? 0n,
    seasonScore:      data?.[3] ?? 0n,
    streakDays:       data?.[4] ?? 0n,
    boostMultiplier:  data?.[5] ?? 100n,
    achievementFlags: data?.[6] ?? 0,
    isLoading,
    refetch,
  }
}
