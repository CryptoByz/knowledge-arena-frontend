import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const scoreStr = searchParams.get('score') || '0'
    const score = Math.max(0, Math.min(10, parseInt(scoreStr) || 0))
    const chain = searchParams.get('chain') || 'general'

    // Multi-color ambient background lighting & themes
    const themes: Record<string, {
      name: string,
      glowLeft: string,
      glowRight: string,
      accent: string,
      border: string,
      chainColor: string
    }> = {
      celo: {
        name: 'Celo Arena',
        glowLeft: 'rgba(217, 119, 6, 0.22)',   // Amber/Gold
        glowRight: 'rgba(21, 128, 61, 0.15)',  // Forest Green (Celo ReFi theme)
        accent: '#fbbf24',                     // Gold Accent
        border: '#d97706',
        chainColor: '#35d07f',                 // Celo Green
      },
      base: {
        name: 'Base Arena',
        glowLeft: 'rgba(0, 82, 255, 0.22)',     // Coinbase Blue
        glowRight: 'rgba(6, 182, 212, 0.15)',   // Cyan
        accent: '#60a5fa',                      // Sky Blue Accent
        border: '#2563eb',
        chainColor: '#0052ff',                  // Base Blue
      },
      arc: {
        name: 'ARC Arena',
        glowLeft: 'rgba(124, 58, 237, 0.22)',   // Intense Purple
        glowRight: 'rgba(236, 72, 153, 0.15)',  // Pink
        accent: '#c084fc',                      // Bright Purple Accent
        border: '#7c3aed',
        chainColor: '#8b5cf6',                  // ARC Violet
      },
      general: {
        name: 'General Arena',
        glowLeft: 'rgba(79, 70, 229, 0.22)',    // Indigo
        glowRight: 'rgba(236, 72, 153, 0.15)',  // Pink
        accent: '#818cf8',                      // Indigo Accent
        border: '#4f46e5',
        chainColor: '#6366f1',
      }
    }

    const theme = themes[chain.toLowerCase()] || themes.general

    // 10 Segments matching correct/incorrect questions
    const scoreBlocks = Array.from({ length: 10 }).map((_, i) => {
      const active = i < score
      return (
        <div
          key={i}
          style={{
            width: '42px',
            height: '10px',
            borderRadius: '4px',
            backgroundColor: active ? theme.accent : 'rgba(255, 255, 255, 0.08)',
            border: active ? `1px solid ${theme.accent}` : '1px solid rgba(255, 255, 255, 0.03)',
            marginRight: '8px',
          }}
        />
      )
    })

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
            backgroundColor: '#040508',
            backgroundImage: `
              radial-gradient(circle at 15% 15%, ${theme.glowLeft} 0%, transparent 55%),
              radial-gradient(circle at 85% 85%, ${theme.glowRight} 0%, transparent 55%)
            `,
            fontFamily: 'sans-serif',
            padding: '40px',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Futuristic Background Grid (rendered via SVG Pattern) */}
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.08,
            }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Premium Glassmorphism Card Frame */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '1120px',
              height: '550px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '36px',
              backgroundColor: 'rgba(8, 9, 13, 0.75)',
              padding: '44px 50px',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Top row: Brand header and Chain designation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Brand Logo Hexagon Emblem */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${theme.border}80`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                  }}
                >
                  <span style={{ color: theme.accent, fontSize: '20px', fontWeight: 900 }}>K</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      color: '#ffffff',
                      fontSize: '24px',
                      fontWeight: 900,
                      letterSpacing: '4px',
                    }}
                  >
                    KNOWLEDGE ARENA
                  </span>
                  <span
                    style={{
                      color: '#4b5563',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      marginTop: '2px',
                    }}
                  >
                    PROOF OF EXPERTISE
                  </span>
                </div>
              </div>

              {/* Chain Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.border}40`,
                  borderRadius: '16px',
                  padding: '10px 24px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: theme.chainColor,
                    marginRight: '12px',
                  }}
                />
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  {theme.name}
                </span>
              </div>
            </div>

            {/* Middle Section: Display Score */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 20px',
              }}
            >
              {/* Left detail: Score Big Numbers */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    color: '#6b7280',
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '5px',
                    marginBottom: '8px',
                  }}
                >
                  QUIZ SCORE
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span
                    style={{
                      color: '#ffffff',
                      fontSize: '110px',
                      fontWeight: 950,
                      lineHeight: 1,
                      textShadow: `0 0 40px ${theme.border}30`,
                    }}
                  >
                    {score}
                  </span>
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.15)',
                      fontSize: '65px',
                      fontWeight: 800,
                      margin: '0 12px',
                    }}
                  >
                    /
                  </span>
                  <span
                    style={{
                      color: '#6b7280',
                      fontSize: '65px',
                      fontWeight: 800,
                    }}
                  >
                    10
                  </span>
                </div>
              </div>

              {/* Right detail: Visual Rating Status */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '44px',
                    marginBottom: '8px',
                  }}
                >
                  {score >= 8 ? '🏆' : score >= 5 ? '⭐' : '📖'}
                </span>
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                  }}
                >
                  {score === 10 ? 'PERFECT GAME' : score >= 8 ? 'EXCELLENT' : score >= 5 ? 'COMPLETED' : 'PRACTICE'}
                </span>
                <span
                  style={{
                    color: '#4b5563',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    marginTop: '4px',
                  }}
                >
                  Correct answers verified
                </span>
              </div>
            </div>

            {/* Bottom Row: Score Visual Timeline and Verification Stamp */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '24px',
              }}
            >
              {/* Blocks */}
              <div style={{ display: 'flex', width: '100%', marginBottom: '20px' }}>
                {scoreBlocks}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {/* Onchain Badge */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      marginRight: '12px',
                    }}
                  >
                    <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  </div>
                  <span
                    style={{
                      color: '#22c55e',
                      fontSize: '14px',
                      fontWeight: 800,
                      letterSpacing: '1px',
                    }}
                  >
                    CRYPTOGRAPHICALLY SECURED RESULT
                  </span>
                </div>
                <span
                  style={{
                    color: '#374151',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                  }}
                >
                  WWW.KNOWLEDGE-ARENA.XYZ
                </span>
              </div>
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
