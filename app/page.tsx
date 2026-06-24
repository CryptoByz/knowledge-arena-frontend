import { Metadata } from 'next'
import HomeClient from './home-client'

interface HomeProps {
  searchParams: Promise<{ score?: string; chain?: string }>
}

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const params = await searchParams
  const score = params.score
  const chain = params.chain

  if (score && chain) {
    const chainName = chain.toUpperCase()
    const ogImageUrl = `/api/og?score=${score}&chain=${chain}`
    return {
      title: `Verified Score: ${score}/10 on ${chainName} | Knowledge Arena`,
      description: `Prove your Web3 expertise on Celo, Base, and ARC network daily quizzes.`,
      openGraph: {
        title: `Verified Score: ${score}/10 on ${chainName} | Knowledge Arena`,
        description: `Prove your Web3 expertise on Celo, Base, and ARC network daily quizzes.`,
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
        description: `Prove your Web3 expertise on Celo, Base, and ARC network daily quizzes.`,
        images: [ogImageUrl],
      },
    }
  }

  // Default homepage metadata
  return {
    title: 'Knowledge Arena | The Ultimate Onchain Trivia Platform',
    description: 'Prove your Web3 expertise, build onchain reputation, and earn badges cryptographically verified on Ethereum Layer 2s and Celo.',
  }
}

export default function Page() {
  return <HomeClient />
}
