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
  dailyQuiz:          '0xe68fF67a5B183D0F1A3454CEa12C741966Eb7dC2',
  playerProfile:      '0x5cc33CEFFd7fF94092CB04A2067cB7a1b5D154e3',
  achievementManager: '0x3d6A8C550820B68316F0990286da5b0e805dB2B4',
  badgeNFT:           '0x8F1Ab7894DE24CD114d7CE69d557b04b1e626b2a',
},

    baseSepolia.id]: {
    dailyQuiz:         '0xd88ADB6Ff6835535B97aff0765882D832c0a91F6',
    playerProfile:     '0x5744f79D84Bf0d09284dAF780aE81485C5AaD70E',
    achievementManager:'0x1031907A22bBD1CEDB12F2E45711208b3976E19a',
    rewardPool:        '0xA2eCc86497eed343dBCE8dB6513EFDc9E5a07E23',
    badgeNFT:          '0x49992237a4347645bb4Bd280249602531dD2C1AC',
    usdc:              '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
} as const

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.knowledge-arena.xyz'
