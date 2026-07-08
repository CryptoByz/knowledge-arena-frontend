'use client'

import { useChainId } from 'wagmi'
import { CONTRACTS, celo } from '../config/chains'

export function useChainConfig() {
  const chainId = useChainId()

  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] || null
  const isSupported = chainId === celo.id
  const chainName = chainId === celo.id ? 'Celo' : 'Unsupported'

  return { chainId, contracts, isSupported, chainName }
}
