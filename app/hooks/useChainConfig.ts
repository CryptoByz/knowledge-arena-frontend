'use client'

import { useChainId } from 'wagmi'
import { CONTRACTS, arcTestnet, baseMainnet, celo } from '../config/chains'

export function useChainConfig() {
  const chainId = useChainId()

  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] || null
  const isSupported = chainId === arcTestnet.id || chainId === baseMainnet.id || chainId === celo.id
  const chainName =
    chainId === arcTestnet.id ? 'ARC Testnet' :
    chainId === baseMainnet.id ? 'Base' :
    chainId === celo.id ? 'Celo' :
    'Unsupported'

  return { chainId, contracts, isSupported, chainName }
}
