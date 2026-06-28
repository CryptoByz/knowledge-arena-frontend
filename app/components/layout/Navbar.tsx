'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSwitchChain } from 'wagmi'
import { useChainConfig } from '../../hooks/useChainConfig'
import { arcTestnet, baseMainnet, celo } from '../../config/chains'

export function Navbar() {
  const { isSupported, chainName, chainId } = useChainConfig()
  const { switchChain } = useSwitchChain()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const networks = [
    { id: arcTestnet.id, name: 'ARC Testnet', color: 'bg-indigo-500' },
    { id: baseMainnet.id, name: 'Base', color: 'bg-blue-500' },
    { id: celo.id, name: 'Celo', color: 'bg-amber-500' }
  ]

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNetworkSwitch = (targetChainId: number) => {
    switchChain({ chainId: targetChainId })
    setIsOpen(false)
  }

  // Determine active network color or wrong network styles
  const activeNetworkColor = networks.find(n => n.id === chainId)?.color || 'bg-red-500'

  return (
    <nav className="border-b border-gray-800 bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Knowledge</span>
          <span className="text-xl font-bold text-indigo-400">Arena</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/achievements" className="hover:text-white transition-colors">Achievements</Link>
          <Link href="/faucet" className="hover:text-white transition-colors">Faucet</Link>
          <Link href="/vault" className="hover:text-white transition-colors">Vault</Link>
        </div>

        {/* Chain Selector + Wallet */}
        <div className="flex items-center gap-3">
          
          {/* Network Toggle Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border cursor-pointer select-none
                ${isSupported 
                  ? 'bg-gray-900 text-gray-200 border-gray-800 hover:border-gray-700 hover:bg-gray-800' 
                  : 'bg-red-950/40 text-red-400 border-red-900/60 hover:bg-red-950/60'
                }`}
            >
              {/* Colored Dot Indicator */}
              <span className={`w-2 h-2 rounded-full ${isSupported ? activeNetworkColor : 'bg-red-500 animate-pulse'}`} />
              
              <span>{isSupported ? chainName : 'Wrong Network'}</span>
              
              {/* Chevron Icon */}
              <svg 
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Switch Network
                </div>
                <div className="h-[1px] bg-gray-800 my-1" />
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkSwitch(network.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer
                      ${chainId === network.id 
                        ? 'bg-indigo-950/40 text-indigo-300 font-medium' 
                        : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${network.color}`} />
                      <span>{network.name}</span>
                    </div>
                    {chainId === network.id && (
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ConnectButton showBalance={false} chainStatus="none" />
        </div>

      </div>
    </nav>
  )
}
