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

  const ogImageUrl = `https://knowledge-arena.xyz/api/og?score=${score}&chain=${chain}`

  return {
    metadataBase: new URL('https://knowledge-arena.xyz'),
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
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/40 shadow-2xl backdrop-blur-sm transition-all duration-300">
          <img
            src={`/api/og?score=${score}&chain=${chain}`}
            alt="Score Card"
            className="w-full h-auto block select-all cursor-pointer rounded-3xl"
          />
        </div>
        <p className="text-xs text-gray-500/85 italic text-center">
          💡 Tip: Right-click the card above, select "Copy Image", and paste it directly into your X post!
        </p>
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
