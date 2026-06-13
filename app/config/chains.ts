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

export const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
}

export const SUPPORTED_CHAINS = [arcTestnet, baseSepolia] as const

// Contract adresleri
export const CONTRACTS = {
  [arcTestnet.id]: {
  dailyQuiz:          '0x5039Ed94d6895b6af9F17D2e8D8bc47e8B3C7505',
  playerProfile:      '0x7c5842391cCD0FC17028710417d2D701b7d51FbC',
  achievementManager: '0xdD87cA0A22eF2E9FfAf38f22906163bef96E54F8',
  rewardPool:         '0x82E6969e173f3789339114F14669fC7cb98a6521',
  badgeNFT:           '0x778599EBE8405EcE41d126B8DA591445Dc428996',
  usdc:               '0x3600000000000000000000000000000000000000',
},

  [baseSepolia.id]: {
    dailyQuiz:         '0xd88ADB6Ff6835535B97aff0765882D832c0a91F6',
    playerProfile:     '0x5744f79D84Bf0d09284dAF780aE81485C5AaD70E',
    achievementManager:'0x1031907A22bBD1CEDB12F2E45711208b3976E19a',
    rewardPool:        '0xA2eCc86497eed343dBCE8dB6513EFDc9E5a07E23',
    badgeNFT:          '0x49992237a4347645bb4Bd280249602531dD2C1AC',
    usdc:              '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
