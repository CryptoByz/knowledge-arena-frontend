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
    dailyQuiz:          '0x8172189cCE9b68F94Ee23fB5077748495B85098F',
    playerProfile:      '0xc8Ba5dab61Ed592AA591a56F3880cDC892d78767',
    achievementManager: '0x413cE89ac030b44a261f97Fdcb3D4D49a92322E7',
    badgeNFT:           '0x74d00bdE11e2D8B91601C58E7f1447CF52B6f68a',
  },
  [baseMainnet.id]: {
    dailyQuiz:          '0x8172189cCE9b68F94Ee23fB5077748495B85098F',
    playerProfile:      '0xc8Ba5dab61Ed592AA591a56F3880cDC892d78767',
    achievementManager: '0x413cE89ac030b44a261f97Fdcb3D4D49a92322E7',
    badgeNFT:           '0x74d00bdE11e2D8B91601C58E7f1447CF52B6f68a',
  },
  [celo.id]: {
    dailyQuiz:          '0x8172189cCE9b68F94Ee23fB5077748495B85098F',
    playerProfile:      '0xc8Ba5dab61Ed592AA591a56F3880cDC892d78767',
    achievementManager: '0x413cE89ac030b44a261f97Fdcb3D4D49a92322E7',
    badgeNFT:           '0x74d00bdE11e2D8B91601C58E7f1447CF52B6f68a',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
