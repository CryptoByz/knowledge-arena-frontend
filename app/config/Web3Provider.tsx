'use client'

import { ReactNode, useEffect } from 'react'
import { WagmiProvider, http, useConnect, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import { rabbyWallet, metaMaskWallet, walletConnectWallet, coinbaseWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets'
import { arcTestnet, baseMainnet, celo } from '../config/chains'
import '@rainbow-me/rainbowkit/styles.css'

export const wagmiConfig = getDefaultConfig({
  appName: 'Knowledge Arena',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [arcTestnet, baseMainnet, celo],
  transports: {
    [arcTestnet.id]: http(),
    [baseMainnet.id]: http(),
    [celo.id]: http(),
  },
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet, rabbyWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
})

const queryClient = new QueryClient()

function MiniPayAutoConnectHandler() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay && !isConnected) {
      const injectedConnector = connectors.find(c => c.id === 'injected')
      if (injectedConnector) {
        connect({ connector: injectedConnector })
      }
    }
  }, [isConnected, connectors, connect])

  return null
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#6366f1',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <MiniPayAutoConnectHandler />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
