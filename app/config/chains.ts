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
  dailyQuiz:          '0x2434e3b5713aA7631D4FE38bF28666e17E8639Da',
  playerProfile:      '0x1EF12bB8C40BCE6eBD44b746f72B9291ED32A0B5',
  achievementManager: '0x2f302dB1d2e979a038425da93CDC4Bbf25a0e590',
  rewardPool:         '0x19D803932061E994AE7a4d48902061296af9f797',
  badgeNFT:           '0x86359731BA0D3772CD95a63A093fF31d69E2250f',
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
