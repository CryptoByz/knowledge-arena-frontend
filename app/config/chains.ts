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
    dailyQuiz:          '0xa06cFb8364Bb4f0F89E8bF21344fd3A251A1322D',
    playerProfile:      '0x82952D75cf7176ac5eBb9c599e151f6b5fd46E93',
    achievementManager: '0xfEAabc60dFe0d6c37fF5A0c4BF91cDcc41eD68d8',
    badgeNFT:           '0x92ce60c229D82F2DaD584ED83E0155Fd85C86bC4',
  },
  [baseMainnet.id]: {
    dailyQuiz:          '0xd88ADB6Ff6835535B97aff0765882D832c0a91F6',
    playerProfile:      '0x1031907A22bBD1CEDB12F2E45711208b3976E19a',
    achievementManager: '0xA2eCc86497eed343dBCE8dB6513EFDc9E5a07E23',
    badgeNFT:           '0x5744f79D84Bf0d09284dAF780aE81485C5AaD70E',
  },
  [celo.id]: {
    dailyQuiz:          '0x0000000000000000000000000000000000000000',
    playerProfile:      '0x0000000000000000000000000000000000000000',
    achievementManager: '0x0000000000000000000000000000000000000000',
    badgeNFT:           '0x0000000000000000000000000000000000000000',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
