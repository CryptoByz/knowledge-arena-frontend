'use client'

import { useChainId } from 'wagmi'
import { CONTRACTS, arcTestnet, baseSepolia } from '../config/chains'

export function useChainConfig() {
  const chainId = useChainId()

  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] || null
  const isSupported = chainId === arcTestnet.id || chainId === baseSepolia.id
  const chainName = chainId === arcTestnet.id ? 'ARC Testnet' : chainId === baseSepolia.id ? 'Base Sepolia' : 'Unsupported'

  return { chainId, contracts, isSupported, chainName }
}
