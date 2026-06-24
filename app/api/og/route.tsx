import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const score = searchParams.get('score') || '0'
    const chain = searchParams.get('chain') || 'general'

    // Define colors and styles based on chain
    const themes: Record<string, { name: string, glow: string, accent: string, border: string }> = {
      celo: {
        name: 'Celo Arena',
        glow: 'rgba(217, 119, 6, 0.18)', // Amber
        accent: '#f59e0b', // Amber-500
        border: '#d97706', // Amber-600
      },
      base: {
        name: 'Base Arena',
        glow: 'rgba(37, 99, 235, 0.18)', // Blue
        accent: '#3b82f6', // Blue-500
        border: '#2563eb', // Blue-600
      },
      arc: {
        name: 'ARC Arena',
        glow: 'rgba(124, 58, 237, 0.18)', // Purple
        accent: '#8b5cf6', // Purple-500
        border: '#7c3aed', // Purple-600
      },
      general: {
        name: 'General Arena',
        glow: 'rgba(99, 102, 241, 0.18)', // Indigo
        accent: '#6366f1', // Indigo-500
        border: '#4f46e5', // Indigo-600
      }
    }

    const theme = themes[chain.toLowerCase()] || themes.general

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#050508',
            backgroundImage: `radial-gradient(circle at center, ${theme.glow} 0%, #050508 70%)`,
            fontFamily: 'sans-serif',
            padding: '40px',
            boxSizing: 'border-box',
          }}
        >
          {/* Card Border */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '1080px',
              height: '550px',
              border: `2px solid rgba(255, 255, 255, 0.05)`,
              borderRadius: '32px',
              backgroundColor: 'rgba(10, 11, 16, 0.6)',
              padding: '48px',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Top Row: Brand & Chain Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: 900,
                    letterSpacing: '3px',
                  }}
                >
                  KNOWLEDGE ARENA
                </span>
                <span
                  style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '1.5px',
                    marginTop: '4px',
                  }}
                >
                  ONCHAIN TRIVIA PLATFORM
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${theme.border}50`,
                  borderRadius: '16px',
                  padding: '8px 20px',
                }}
              >
                <span
                  style={{
                    color: theme.accent,
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  {theme.name}
                </span>
              </div>
            </div>

            {/* Middle Section: Big Score */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '20px 0',
              }}
            >
              <span
                style={{
                  color: '#9ca3af',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '4px',
                  marginBottom: '10px',
                }}
              >
                DAILY QUIZ SCORE
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '120px',
                    fontWeight: 900,
                    lineHeight: 1,
                    textShadow: `0 0 40px ${theme.border}40`,
                  }}
                >
                  {score}
                </span>
                <span
                  style={{
                    color: '#4b5563',
                    fontSize: '70px',
                    fontWeight: 750,
                    margin: '0 15px',
                  }}
                >
                  /
                </span>
                <span
                  style={{
                    color: '#9ca3af',
                    fontSize: '70px',
                    fontWeight: 750,
                  }}
                >
                  10
                </span>
              </div>
            </div>

            {/* Bottom Row: Verification Badge & Rep Slogan */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    marginRight: '12px',
                  }}
                >
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.33334 6L5.33334 10L14.6667 1.33334"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    color: '#22c55e',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                  }}
                >
                  VERIFIED ONCHAIN RESULT
                </span>
              </div>
              <span
                style={{
                  color: '#4b5563',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                }}
              >
                PROVE YOUR EXPERTISE. BUILD ONCHAIN REP.
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (err: any) {
    console.error('Error rendering OG image:', err.message)
    return new Response(`Failed to generate image`, { status: 500 })
  }
}
