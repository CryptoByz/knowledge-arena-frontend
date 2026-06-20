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
    dailyQuiz:          '0x89bf7bbfd6F2C9C03abe3Fd1cbF7526C579FC1E4',
    playerProfile:      '0xd5905F764635d07bA11b80e5d6195fDC09122859',
    achievementManager: '0xCe0966A8d3a29c5e5B4812e1aAFcFD3494ee5672',
    badgeNFT:           '0x38751e1e30B075958935143E3A46741C4d9Aa4A0',
  },
  [baseMainnet.id]: {
    dailyQuiz:          '0x89bf7bbfd6F2C9C03abe3Fd1cbF7526C579FC1E4',
    playerProfile:      '0xd5905F764635d07bA11b80e5d6195fDC09122859',
    achievementManager: '0xCe0966A8d3a29c5e5B4812e1aAFcFD3494ee5672',
    badgeNFT:           '0x38751e1e30B075958935143E3A46741C4d9Aa4A0',
  },
  [celo.id]: {
    dailyQuiz:          '0x89bf7bbfd6F2C9C03abe3Fd1cbF7526C579FC1E4',
    playerProfile:      '0xd5905F764635d07bA11b80e5d6195fDC09122859',
    achievementManager: '0xCe0966A8d3a29c5e5B4812e1aAFcFD3494ee5672',
    badgeNFT:           '0x38751e1e30B075958935143E3A46741C4d9Aa4A0',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
