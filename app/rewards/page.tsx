'use client'

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useChainConfig } from '../hooks/useChainConfig'
import { REWARD_POOL_ABI } from '../config/abi'
import { formatUnits } from 'viem'

export default function RewardsPage() {
  const { address, isConnected } = useAccount()
  const { contracts, isSupported } = useChainConfig()

  const { data: claimable, refetch } = useReadContract({
    address: contracts?.rewardPool as `0x${string}`,
    abi: REWARD_POOL_ABI,
    functionName: 'claimableUSDC',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  const { data: poolBalances } = useReadContract({
    address: contracts?.rewardPool as `0x${string}`,
    abi: REWARD_POOL_ABI,
    functionName: 'getPoolBalances',
    query: { enabled: !!contracts },
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { onSuccess: () => refetch() },
  })

  const handleClaim = () => {
    if (!contracts) return
    writeContract({
      address: contracts.rewardPool as `0x${string}`,
      abi: REWARD_POOL_ABI,
      functionName: 'claimUSDC',
    })
  }

  if (!isConnected) {
    return <CenteredMessage title="Connect your wallet" subtitle="Connect your wallet to view rewards." />
  }

  if (!isSupported) {
    return <CenteredMessage title="Wrong network" subtitle="Switch to ARC Testnet or Base Sepolia." />
  }

  const claimableAmount = claimable ? Number(formatUnits(claimable, 6)) : 0

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Rewards</h1>

      {/* Claimable */}
      <div className="bg-gray-900 border border-indigo-700 rounded-xl p-8 text-center space-y-4">
        <p className="text-gray-400">Available to Claim</p>
        <p className="text-5xl font-bold text-indigo-400">{claimableAmount.toFixed(2)} USDC</p>
        <button
          onClick={handleClaim}
          disabled={claimableAmount === 0 || isPending || isConfirming}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {isPending || isConfirming ? 'Claiming...' : claimableAmount > 0 ? 'Claim USDC' : 'Nothing to claim'}
        </button>
      </div>

      {/* Pool balances */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">Reward Pools</h2>
        <div className="grid grid-cols-3 gap-4">
          <PoolCard label="Weekly Pool" value={poolBalances?.[0]} />
          <PoolCard label="Monthly Pool" value={poolBalances?.[1]} />
          <PoolCard label="Season Pool" value={poolBalances?.[2]} />
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 text-sm text-gray-400">
        <p className="font-medium text-white">How rewards work</p>
        <p>70% of every entry fee goes into the reward pools. Top players on weekly, monthly, and season leaderboards earn USDC and exclusive NFT badges.</p>
        <p>Rewards are distributed at the end of each period. Come back here to claim once a period ends.</p>
      </div>
    </div>
  )
}

function PoolCard({ label, value }: { label: string; value?: bigint }) {
  const amount = value ? Number(formatUnits(value, 6)) : 0
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-xl font-bold text-green-400 mt-1">{amount.toFixed(2)}</p>
      <p className="text-gray-500 text-xs">USDC</p>
    </div>
  )
}

function CenteredMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-3 pt-24">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  )
}
