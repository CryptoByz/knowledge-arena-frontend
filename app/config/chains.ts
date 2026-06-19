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
    dailyQuiz:          '0xBe97A1F87D166487FD79B1809Ea5890398358F67',
    playerProfile:      '0xe9ae25F42Fc221E6C0d51c43300179F41713e4c1',
    achievementManager: '0x48CdE43521573037d597bfc250Fbc2B24192fb4b',
    badgeNFT:           '0xcAF20a164E00f614c74520D36a7F78E0c6de8365',
  },
  [baseMainnet.id]: {
    dailyQuiz:          '0xBe97A1F87D166487FD79B1809Ea5890398358F67',
    playerProfile:      '0xe9ae25F42Fc221E6C0d51c43300179F41713e4c1',
    achievementManager: '0x48CdE43521573037d597bfc250Fbc2B24192fb4b',
    badgeNFT:           '0xcAF20a164E00f614c74520D36a7F78E0c6de8365',
  },
  [celo.id]: {
    dailyQuiz:          '0xBe97A1F87D166487FD79B1809Ea5890398358F67',
    playerProfile:      '0xe9ae25F42Fc221E6C0d51c43300179F41713e4c1',
    achievementManager: '0x48CdE43521573037d597bfc250Fbc2B24192fb4b',
    badgeNFT:           '0xcAF20a164E00f614c74520D36a7F78E0c6de8365',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
