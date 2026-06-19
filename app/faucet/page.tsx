'use client'

import { useAccount } from 'wagmi'

export default function FaucetPage() {
  const { isConnected } = useAccount()

  const tokens = [
    {
      name: 'USDC',
      description: 'Used as the native gas token and entry token on ARC Testnet.',
      address: '0x3600000000000000000000000000000000000000',
      decimals: 6,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
    },
    {
      name: 'EURC',
      description: 'Euro-pegged stablecoin on ARC Testnet.',
      address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
      decimals: 6,
      color: 'from-green-600 to-teal-600',
      textColor: 'text-green-400',
    }
  ]

  const addTokenToWallet = async (address: string, symbol: string, decimals: number) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('Wallet extension not detected.')
      return
    }
    try {
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address,
            symbol,
            decimals,
          },
        },
      })
    } catch (error) {
      console.error('Error adding token to wallet:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-white">Arc Testnet Faucet</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Need testnet tokens for gas or interactions? Claim them from the official Circle faucet and easily add them to your wallet.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {tokens.map((token) => (
          <div key={token.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between hover:border-gray-700 transition-all hover:scale-[1.01]">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className={`text-2xl font-bold ${token.textColor}`}>{token.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                  {token.decimals} Decimals
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{token.description}</p>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">Contract Address</span>
                <span className="text-xs text-gray-300 font-mono break-all bg-gray-950 px-2 py-1 rounded block border border-gray-900 select-all">
                  {token.address}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2.5 rounded-xl font-semibold text-center block text-sm transition-all text-white bg-gradient-to-r ${token.color} hover:brightness-110 shadow-lg`}
              >
                Claim {token.name} on Circle Faucet ↗
              </a>
              {isConnected && (
                <button
                  onClick={() => addTokenToWallet(token.address, token.name, token.decimals)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-center block transition-all bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 cursor-pointer"
                >
                  Add {token.name} to Wallet
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-6 space-y-3">
        <h3 className="text-base font-semibold text-indigo-300 flex items-center gap-2">
          💡 How to claim on Circle Faucet
        </h3>
        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2 leading-relaxed">
          <li>Click the claim button for your desired token above to visit the Circle Faucet.</li>
          <li>Choose <strong>Arc Testnet</strong> from the network list dropdown.</li>
          <li>Paste your wallet address in the input field.</li>
          <li>Select the token (USDC or EURC) and click <strong>Submit</strong>. Your tokens will arrive shortly!</li>
        </ol>
      </div>
    </div>
  )
}
