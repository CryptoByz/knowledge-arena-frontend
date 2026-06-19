'use client'

import { useReadContract } from 'wagmi'
import { useChainConfig } from './useChainConfig'
import { DAILY_QUIZ_ABI } from '../config/abi'

export function useQuizState(address?: `0x${string}`) {
  const { contracts } = useChainConfig()

  const isDummy = !contracts?.dailyQuiz || (contracts.dailyQuiz as string) === '0x0000000000000000000000000000000000000000'

  const { data: canPlay, refetch: refetchCanPlay } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'canPlay',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && !isDummy },
  })

  const { data: isTodayReady } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'isTodayReady',
    query: { enabled: !!contracts && !isDummy },
  })

  const { data: todayScore } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'getTodayScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && !isDummy },
  })

  const { data: lastPlayedDay } = useReadContract({
    address: contracts?.dailyQuiz as `0x${string}`,
    abi: DAILY_QUIZ_ABI,
    functionName: 'lastPlayedDay',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && !isDummy },
  })

  const today = BigInt(Math.floor(Date.now() / 86400000))
  const hasEnteredToday = isDummy ? false : (lastPlayedDay !== undefined && lastPlayedDay === today)

  return {
    canPlay:      isDummy ? true : (canPlay ?? false),
    isTodayReady: isDummy ? true : (isTodayReady ?? false),
    todayScore:   isDummy ? 0 : (todayScore?.[0] ?? 0),
    hasSubmitted: isDummy ? false : (todayScore?.[1] ?? false),
    hasEnteredToday,
    refetchCanPlay,
  }
}
