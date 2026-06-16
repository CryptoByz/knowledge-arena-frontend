'use client'

import { useReadContract } from 'wagmi'
import { useChainConfig } from './useChainConfig'
import { DAILY_QUIZ_ABI } from '../config/abi'

export function useQuizState(address?: `0x${string}`) {
  const { contracts } = useChainConfig()

  const { data: canPlay, refetch: refetchCanPlay } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'canPlay',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  const { data: isTodayReady } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'isTodayReady',
    query: { enabled: !!contracts },
  })

  const { data: todayScore } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'getTodayScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  return {
    canPlay:      canPlay ?? false,
    isTodayReady: isTodayReady ?? false,
    todayScore:   todayScore?.[0] ?? 0,
    hasSubmitted: todayScore?.[1] ?? false,
    refetchCanPlay,
  }
}
