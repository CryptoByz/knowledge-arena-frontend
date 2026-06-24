import { Metadata } from 'next'
import Link from 'next/link'

interface SharePageProps {
  searchParams: Promise<{ score?: string; chain?: string }>
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams
  const score = params.score || '0'
  const chain = params.chain || 'general'
  const chainName = chain.toUpperCase()

  const ogImageUrl = `/api/og?score=${score}&chain=${chain}`

  return {
    title: `Verified Score: ${score}/10 on ${chainName} | Knowledge Arena`,
    description: `I just scored ${score}/10 on the ${chainName} Daily Quiz at Knowledge Arena! Join the arena and prove your onchain reputation.`,
    openGraph: {
      title: `Verified Score: ${score}/10 on ${chainName} | Knowledge Arena`,
      description: `I just scored ${score}/10 on the ${chainName} Daily Quiz at Knowledge Arena! Join the arena and prove your onchain reputation.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Knowledge Arena Score Card: ${score}/10`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Verified Score: ${score}/10 on ${chainName} | Knowledge Arena`,
      description: `I just scored ${score}/10 on the ${chainName} Daily Quiz at Knowledge Arena! Join the arena and prove your onchain reputation.`,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams
  const score = params.score || '0'
  const chain = params.chain || 'general'
  const chainName = chain.charAt(0).toUpperCase() + chain.slice(1).toLowerCase()

  const themeColors: Record<string, { accent: string, border: string, textGlow: string, bgGlow: string }> = {
    celo: {
      accent: 'from-amber-400 to-yellow-500',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      textGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
      bgGlow: 'from-amber-950/20 via-transparent to-transparent',
    },
    base: {
      accent: 'from-blue-400 to-indigo-500',
      border: 'border-blue-500/30 hover:border-blue-500/60',
      textGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.35)]',
      bgGlow: 'from-blue-950/20 via-transparent to-transparent',
    },
    arc: {
      accent: 'from-purple-400 to-indigo-500',
      border: 'border-purple-500/30 hover:border-purple-500/60',
      textGlow: 'shadow-[0_0_20px_rgba(139,92,246,0.35)]',
      bgGlow: 'from-purple-950/20 via-transparent to-transparent',
    },
    general: {
      accent: 'from-indigo-400 to-purple-500',
      border: 'border-indigo-500/30 hover:border-indigo-500/60',
      textGlow: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
      bgGlow: 'from-indigo-950/20 via-transparent to-transparent',
    },
  }

  const theme = themeColors[chain.toLowerCase()] || themeColors.general

  return (
    <div className={`max-w-2xl mx-auto space-y-8 pt-12 pb-16 min-h-[70vh] flex flex-col justify-center bg-radial ${theme.bgGlow}`}>
      {/* Dynamic Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] px-3 py-1 rounded-full border border-green-500/30 bg-green-950/30 text-green-400 font-black tracking-widest uppercase">
          ✓ Verified Achievement
        </span>
        <h1 className="text-3xl font-black text-white pt-2">
          Daily Quiz Score Card
        </h1>
      </div>

      {/* Web Score Card Preview */}
      <div
        className={`relative overflow-hidden rounded-3xl border ${theme.border} bg-gray-900/60 p-8 md:p-10 shadow-2xl backdrop-blur-md transition-all duration-300`}
        style={{
          minHeight: chain.toLowerCase() === 'arc' ? '300px' : undefined,
        }}
      >
        {chain.toLowerCase() === 'arc' && (
          <img
            src="/arc-kart.png"
            alt="Arc Card"
            className="absolute inset-0 w-full h-full object-cover scale-[1.05] pointer-events-none z-0"
          />
        )}
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

        <div className="relative z-10 space-y-8">
          {chain.toLowerCase() === 'arc' ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-6" />
              <div className="bg-[#0b0814]/90 border border-purple-500/20 px-8 py-2.5 rounded-2xl flex items-baseline gap-1.5 relative z-20">
                <span className="text-6xl md:text-7xl font-black text-white drop-shadow-md">
                  {score}
                </span>
                <span className="text-2xl text-gray-700 font-bold">/</span>
                <span className="text-2xl text-gray-500 font-bold">10</span>
              </div>
              <div className="h-6" />
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-lg font-black tracking-wider text-white">KNOWLEDGE ARENA</span>
                  <span className="text-[10px] text-gray-500 tracking-wider font-bold block uppercase">Onchain Trivia</span>
                </div>
                <span className={`px-4 py-1.5 rounded-xl border border-white/5 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent font-black tracking-wider text-sm uppercase`}>
                  {chainName} Arena
                </span>
              </div>

              {/* Middle Row: Score */}
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-[11px] text-gray-500 tracking-[0.25em] font-extrabold block mb-2 uppercase">
                  Score Obtained
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-8xl md:text-9xl font-black text-white drop-shadow-lg`}>
                    {score}
                  </span>
                  <span className="text-4xl md:text-5xl text-gray-700 font-bold">/</span>
                  <span className="text-4xl md:text-5xl text-gray-500 font-bold">10</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="border-t border-gray-800/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-xs text-green-400 font-bold">
                    ✓
                  </div>
                  <span className="text-xs text-green-400 font-extrabold tracking-wide uppercase">
                    Cryptographically Signed & Verified
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 tracking-wider font-bold uppercase">
                  Proven on {chainName} Network
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Play CTA Button */}
      <div className="text-center pt-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02]"
        >
          Enter the Arena & Play Now
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
