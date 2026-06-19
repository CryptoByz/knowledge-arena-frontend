import { defineChain } from 'viem'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'ARC Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})

export const baseMainnet = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
})

export const celo = defineChain({
  id: 42220,
  name: 'Celo',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celoscan.io' },
  },
})

export const SUPPORTED_CHAINS = [arcTestnet, baseMainnet, celo] as const

export const CONTRACTS = {
  [arcTestnet.id]: {
    dailyQuiz:          '0xf0642c1Df7E31579881e00cfC7A392a810e9E39B',
    playerProfile:      '0x19F6860b0691723C8670039380c6c7A7714949a3',
    achievementManager: '0xD9647B77c383db4cdB4496d1cE6086d6b3465C5B',
    badgeNFT:           '0xb8A7D2c2B181341aF8Aa641eccF4792cB3339d49',
  },
  [baseMainnet.id]: {
    dailyQuiz:          '0xf0642c1Df7E31579881e00cfC7A392a810e9E39B',
    playerProfile:      '0x19F6860b0691723C8670039380c6c7A7714949a3',
    achievementManager: '0xD9647B77c383db4cdB4496d1cE6086d6b3465C5B',
    badgeNFT:           '0xb8A7D2c2B181341aF8Aa641eccF4792cB3339d49',
  },
  [celo.id]: {
    dailyQuiz:          '0xf0642c1Df7E31579881e00cfC7A392a810e9E39B',
    playerProfile:      '0x19F6860b0691723C8670039380c6c7A7714949a3',
    achievementManager: '0xD9647B77c383db4cdB4496d1cE6086d6b3465C5B',
    badgeNFT:           '0xb8A7D2c2B181341aF8Aa641eccF4792cB3339d49',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
