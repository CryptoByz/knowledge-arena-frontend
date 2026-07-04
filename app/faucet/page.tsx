'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { API_URL } from '../config/chains'
import { useLanguage } from '../context/LanguageContext'
import { getTranslation } from '../config/translations'

export default function FaucetPage() {
  const { isConnected, address } = useAccount()
  const { language } = useLanguage()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState<{
    success: boolean
    message: string
    txHash?: string
  } | null>(null)

  const tokens = [
    {
      name: 'USDC',
      description: language === 'tr' 
        ? 'ARC Testnet üzerinde yerel gas tokenı ve giriş tokenı olarak kullanılır.' 
        : 'Used as the native gas token and entry token on ARC Testnet.',
      address: '0x3600000000000000000000000000000000000000',
      decimals: 6,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
    },
    {
      name: 'EURC',
      description: language === 'tr' 
        ? 'ARC Testnet üzerinde Euro bazlı stablecoin.' 
        : 'Euro-pegged stablecoin on ARC Testnet.',
      address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
      decimals: 6,
      color: 'from-green-600 to-teal-600',
      textColor: 'text-green-400',
    }
  ]

  const addTokenToWallet = async (address: string, symbol: string, decimals: number) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert(language === 'tr' ? 'Cüzdan eklentisi bulunamadı.' : 'Wallet extension not detected.')
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

  const handleClaimCelo = async () => {
    if (!isConnected || !address) {
      alert(language === 'tr' ? 'Lütfen önce cüzdanınızı bağlayın!' : 'Please connect your wallet first!')
      return
    }

    setIsClaiming(true)
    setClaimStatus(null)

    try {
      const res = await fetch(`${API_URL}/api/faucet/claim-celo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setClaimStatus({
          success: true,
          message: language === 'tr' ? '0.25 CELO başarıyla gönderildi!' : '0.25 CELO claimed successfully!',
          txHash: data.txHash,
        })
      } else {
        setClaimStatus({
          success: false,
          message: data.error || (language === 'tr' ? 'CELO gönderilemedi. Lütfen tekrar deneyin.' : 'Failed to claim CELO. Please try again.'),
        })
      }
    } catch (err) {
      console.error('[Faucet] Error claiming CELO:', err)
      setClaimStatus({
        success: false,
        message: language === 'tr' ? 'Ağ hatası. Lütfen daha sonra tekrar deneyin.' : 'Network error. Please try again later.',
      })
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pt-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          {language === 'tr' ? 'Ekosistem Muslukları' : 'Ecosystem Faucets'}
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
          {language === 'tr'
            ? 'Arenaya katılmak için gas tokenına veya stablecoinlere mi ihtiyacınız var? Testnet stablecoinlerini veya yerel gas tokenlarını aşağıdan talep edin.'
            : 'Need gas or stablecoins to participate in the arenas? Claim testnet stablecoins or claim native gas tokens directly below.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Column 1: Celo Gas Dropper */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 shadow-xl bg-gradient-to-b from-gray-900 via-gray-900 to-amber-950/10">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-2xl font-extrabold text-amber-400">
                {language === 'tr' ? 'Celo Gas Dağıtıcısı' : 'Celo Gas Dropper'}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-800/80 font-semibold uppercase tracking-wider">
                {language === 'tr' ? '1 Hak Sınırı' : '1 Claim Limit'}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {language === 'tr'
                ? 'Quizlere katılabilmeniz için gas ücretlerini karşılamak üzere küçük bir miktar yerel CELO edinin. Kötüye kullanımı önlemek amacıyla, talep hakkı her adres için tam olarak 1 adet ile sınırlıdır.'
                : 'Get a small amount of native CELO to cover gas fees for taking the quiz. To prevent abuse, claims are limited to exactly 1 per address.'}
            </p>
            <div className="space-y-1.5 bg-gray-950 p-4 rounded-xl border border-gray-850">
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">
                {language === 'tr' ? 'Kural Kısıtlamaları' : 'Rule Restrictions'}
              </span>
              <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
                <li>{language === 'tr' ? 'Cüzdan adresi başına sadece bir talep işlemi.' : 'One claim transaction per wallet address.'}</li>
                <li>{language === 'tr' ? '0.25 CELO gönderilir (onlarca gas ücretine fazlasıyla yeterlidir).' : 'Receives 0.25 CELO (enough for dozens of gas fees).'}</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            {claimStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  claimStatus.success
                    ? 'bg-green-950/40 border-green-800/60 text-green-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                <p className="font-semibold">{claimStatus.message}</p>
                {claimStatus.txHash && (
                  <a
                    href={`https://celoscan.io/tx/${claimStatus.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-green-400 font-mono hover:text-green-300 break-all block mt-1.5"
                  >
                    {language === 'tr' ? 'İşlemi CeloScan\'de Görüntüle ↗' : 'View Tx on CeloScan ↗'}
                  </a>
                )}
              </div>
            )}

            <button
              onClick={handleClaimCelo}
              disabled={isClaiming || !isConnected}
              className={`w-full py-3 rounded-xl font-bold text-center block text-sm transition-all shadow-lg select-none cursor-pointer ${
                isConnected
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-black shadow-amber-500/10'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
              }`}
            >
              {!isConnected
                ? (language === 'tr' ? 'CELO Talep Etmek İçin Cüzdanı Bağla' : 'Connect Wallet to Claim CELO')
                : isClaiming
                ? (language === 'tr' ? 'CELO Gas Talep Ediliyor...' : 'Claiming CELO Gas...')
                : (language === 'tr' ? '0.25 CELO Talep Et' : 'Claim 0.25 CELO')}
            </button>
          </div>
        </div>

        {/* Column 2: ARC Testnet Faucet */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all duration-300 shadow-xl bg-gradient-to-b from-gray-900 via-gray-900 to-blue-950/10">
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <span className="text-2xl font-extrabold text-blue-400">ARC Testnet</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-800/80 font-semibold uppercase tracking-wider">
                {language === 'tr' ? 'Dış Bağlantı' : 'External Link'}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {language === 'tr'
                ? 'USDC, ARC Testnet üzerinde yerel gas tokenı ve giriş ücreti tokenı olarak kullanılır. Circle Faucet üzerinden hem USDC hem de EURC testnet stablecoinlerini talep edebilirsiniz.'
                : 'USDC is used as the native gas token and entry fee token on ARC Testnet. Claim both USDC and EURC testnet stables directly from the official Circle Faucet.'}
            </p>

            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.name} className="p-4 rounded-xl bg-gray-950 border border-gray-850 flex justify-between items-center">
                  <span className={`text-base font-bold ${token.textColor}`}>{token.name}</span>
                  <button
                    onClick={() => addTokenToWallet(token.address, token.name, token.decimals)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 transition-colors cursor-pointer shadow-sm"
                  >
                    {language === 'tr' ? `${token.name} Cüzdana Ekle` : `Add ${token.name} to Wallet`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-bold text-center block text-sm transition-all text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              {language === 'tr' ? 'Circle Faucet Musluk Sitesi ↗' : 'Circle Faucet Website ↗'}
            </a>
          </div>
        </div>
      </div>

      {/* Guide Section */}
      <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-6 space-y-3">
        <h3 className="text-base font-semibold text-indigo-300 flex items-center gap-2">
          {language === 'tr' ? '💡 Musluk talep yönergeleri' : '💡 Faucet claim instructions'}
        </h3>
        <ul className="list-disc pl-5 text-sm text-gray-400 space-y-2 leading-relaxed">
          {language === 'tr' ? (
            <>
              <li><strong>Celo Gas Dağıtıcısı:</strong> Cüzdan eklentinizin Celo ağını desteklediğinden emin olun, cüzdanınızı bağlayın ve talep butonuna tıklayın. Adresinize doğrudan 0.25 CELO gönderilecektir.</li>
              <li><strong>Circle Faucet Musluğu:</strong> Circle Faucet linkine tıklayın, açılır menüden <strong>Arc Testnet</strong> ağını seçin, cüzdan adresinizi yapıştırın, tokenı seçin ve işlemi tamamlayın.</li>
            </>
          ) : (
            <>
              <li><strong>Celo Gas Dropper:</strong> Make sure wallet extension supports Celo, connect your wallet, and click claim. Your address receives 0.25 CELO directly to your connected wallet.</li>
              <li><strong>Circle Faucet:</strong> Click Circle Faucet link, choose <strong>Arc Testnet</strong> from the dropdown, paste your wallet address, select the token, and submit.</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
