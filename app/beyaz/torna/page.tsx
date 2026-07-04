'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   Tüm stiller burada — dış CSS/Tailwind bağımlılığı yok
───────────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#0a0e1a;color:#f1f5f9;font-family:'Inter',sans-serif;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(59,130,246,.03)1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.03)1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0}

  /* layout */
  .wrap{position:relative;z-index:1;max-width:1600px;margin:0 auto;padding:0 16px 48px}
  .grid{display:grid;grid-template-columns:360px 1fr 390px;gap:18px;align-items:start}
  @media(max-width:1100px){.grid{grid-template-columns:1fr 1fr}}
  @media(max-width:700px){.grid{grid-template-columns:1fr}}

  /* header */
  header{padding:20px 0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1e2d4f;margin-bottom:22px;flex-wrap:wrap;gap:12px}
  .logo{display:flex;align-items:center;gap:12px}
  .logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 20px rgba(99,102,241,.4);flex-shrink:0}
  .logo h1{font-size:18px;font-weight:700;background:linear-gradient(135deg,#fff 40%,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .logo p{font-size:11px;color:#475569}
  .badges{display:flex;gap:6px;flex-wrap:wrap}
  .badge{padding:4px 10px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.4px}
  .b-blue{background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);color:#93c5fd}
  .b-green{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7}

  /* panel */
  .panel{background:#131c35;border:1px solid #1e2d4f;border-radius:14px;overflow:hidden;transition:border-color .2s}
  .panel:hover{border-color:#2d4a7a}
  .ph{padding:14px 18px;border-bottom:1px solid #1e2d4f;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.02)}
  .ph-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
  .ic-blue{background:rgba(59,130,246,.15)} .ic-green{background:rgba(16,185,129,.15)}
  .ic-purple{background:rgba(139,92,246,.15)} .ic-orange{background:rgba(245,158,11,.15)}
  .pt{font-size:13px;font-weight:600} .ps{font-size:11px;color:#475569;margin-top:1px}
  .pb{padding:18px}

  /* forms */
  .fg{margin-bottom:13px}
  label{display:block;font-size:10px;font-weight:600;color:#94a3b8;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
  input[type=number],input[type=text],select{width:100%;padding:8px 11px;background:#0d1526;border:1px solid #1e2d4f;border-radius:8px;color:#f1f5f9;font-size:12px;font-family:'Inter',sans-serif;transition:border-color .2s,box-shadow .2s;outline:none;-webkit-appearance:none;appearance:none}
  input:focus,select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
  .fr{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .fr3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}

  /* upload */
  .upload{border:2px dashed #1e2d4f;border-radius:12px;padding:24px 16px;text-align:center;cursor:pointer;transition:all .3s;background:#0d1526;position:relative}
  .upload:hover,.upload.drag{border-color:#3b82f6;background:rgba(59,130,246,.08)}
  .upload input{display:none}
  .upload-icon{font-size:32px;margin-bottom:8px}
  .upload-title{font-size:13px;font-weight:600;margin-bottom:3px}
  .upload-sub{font-size:11px;color:#475569}
  .upload-preview{max-width:100%;max-height:160px;object-fit:contain;border-radius:8px;display:none;margin:0 auto}
  .pdf-badge{margin-top:8px;font-size:10px;color:#10b981;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);padding:4px 10px;border-radius:5px;display:inline-block}

  /* ops */
  .op-item{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#0d1526;border:1px solid #1e2d4f;border-radius:10px;cursor:pointer;transition:all .2s;margin-bottom:7px}
  .op-item:hover,.op-item.sel{border-color:#3b82f6;background:rgba(59,130,246,.08)}
  .op-item input[type=checkbox]{width:15px;height:15px;accent-color:#3b82f6;cursor:pointer;flex-shrink:0}
  .op-name{font-size:12px;font-weight:600} .op-desc{font-size:10px;color:#475569;margin-top:1px}
  .op-badge{padding:2px 7px;border-radius:4px;font-size:9px;font-weight:600;background:rgba(59,130,246,.15);color:#93c5fd;flex-shrink:0}

  /* canvas */
  .canvas-wrap{background:#131c35;border:1px solid #1e2d4f;border-radius:14px;overflow:hidden}
  .ctb{padding:11px 14px;border-bottom:1px solid #1e2d4f;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.02);flex-wrap:wrap}
  .ctb-title{font-size:12px;font-weight:600;flex:1;min-width:100px}
  .coord{font-family:'JetBrains Mono',monospace;font-size:11px;color:#06b6d4;padding:5px 9px;background:#0d1526;border:1px solid #1e2d4f;border-radius:6px;min-width:140px;text-align:center}
  canvas{display:block;width:100%;cursor:crosshair}
  .cinfo{padding:7px 14px;border-top:1px solid #1e2d4f;display:flex;gap:16px;font-size:10px;color:#475569;background:rgba(255,255,255,.01);flex-wrap:wrap}
  .dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:4px}

  /* table */
  .tbl-wrap{border:1px solid #1e2d4f;border-radius:9px;overflow:hidden;margin-bottom:11px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  thead th{padding:7px 8px;background:#0d1526;color:#475569;font-weight:600;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
  tbody tr{border-top:1px solid #1e2d4f}
  tbody tr:hover{background:rgba(255,255,255,.02)}
  tbody td{padding:5px 6px}
  tbody td input{padding:4px 7px;font-size:11px;border-radius:5px}
  tbody td select{padding:4px 5px;font-size:10px;border-radius:5px}
  .del-btn{background:none;border:none;color:#475569;cursor:pointer;padding:3px 6px;border-radius:4px;font-size:13px;transition:all .2s}
  .del-btn:hover{color:#ef4444;background:rgba(239,68,68,.1)}

  /* gcode */
  .gc-out{font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.75;padding:14px;background:#060c1a;border:1px solid #1e2d4f;border-radius:9px;height:440px;overflow-y:auto;color:#94a3b8;white-space:pre;scrollbar-width:thin;scrollbar-color:#1e2d4f transparent}
  .gc-out::-webkit-scrollbar{width:5px}
  .gc-out::-webkit-scrollbar-thumb{background:#1e2d4f;border-radius:3px}
  .gc-comment{color:#374151} .gc-tool{color:#f59e0b;font-weight:600}
  .gc-rapid{color:#06b6d4} .gc-feed{color:#3b82f6}
  .gc-spindle{color:#8b5cf6} .gc-cycle{color:#10b981}
  .gc-coord{color:#e2e8f0} .gc-param{color:#fbbf24}
  .gc-hdr{color:#6b7280}

  /* stats */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:13px}
  .stat{padding:11px 12px;background:#0d1526;border:1px solid #1e2d4f;border-radius:9px;text-align:center}
  .sv{font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace;color:#06b6d4}
  .sl{font-size:9px;color:#475569;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}

  /* buttons */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .2s;font-family:'Inter',sans-serif}
  .btn:hover{transform:translateY(-1px)}
  .btn-primary{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;box-shadow:0 3px 12px rgba(59,130,246,.3)}
  .btn-success{background:linear-gradient(135deg,#059669,#10b981);color:#fff;box-shadow:0 3px 12px rgba(16,185,129,.3)}
  .btn-outline{background:transparent;border:1px solid #1e2d4f;color:#94a3b8}
  .btn-outline:hover{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,.08)}
  .btn-sm{padding:5px 11px;font-size:11px}
  .btn-gen{background:linear-gradient(135deg,#059669,#10b981,#34d399);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;width:100%;border:none;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 0 20px rgba(16,185,129,.3);transition:all .3s}
  .btn-gen:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(16,185,129,.5)}
  .btn-gen:disabled{opacity:.6;cursor:not-allowed;transform:none}

  /* section title */
  .sec{font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.8px;margin:14px 0 9px;display:flex;align-items:center;gap:7px}
  .sec::after{content:'';flex:1;height:1px;background:#1e2d4f}

  /* alert */
  .alert{padding:9px 12px;border-radius:7px;font-size:11px;display:flex;align-items:flex-start;gap:7px;margin-bottom:11px}
  .alert-info{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);color:#93c5fd}
  .alert-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:#fcd34d}
  .alert-ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:#6ee7b7}

  /* tool list */
  .tool-row{display:flex;align-items:center;gap:9px;padding:8px 10px;background:#0d1526;border:1px solid #1e2d4f;border-radius:8px;margin-bottom:6px}
  .tool-num{font-family:'JetBrains Mono',monospace;font-size:11px;color:#f59e0b;font-weight:600;min-width:50px}
  .tool-name{font-size:11px;font-weight:600} .tool-tip{font-size:9px;color:#475569}

  /* pdf loading */
  .progress{width:100%;height:4px;background:#1e2d4f;border-radius:2px;margin-top:8px;overflow:hidden}
  .progress-bar{height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1);border-radius:2px;transition:width .3s}
`

/* ─── Types ──────────────────────────────────────────────────────────────── */
type MoveType = 'G00' | 'G01' | 'G02' | 'G03'
interface ProfilePoint { x: number; z: number; move: MoveType; r: number }
interface Op { id: string; name: string; desc: string; gcode: string; checked: boolean }

/* ─── Constants ─────────────────────────────────────────────────────────── */
const MAT_PARAMS: Record<string, { vc: number; f: number; ap: number }> = {
  steel_mild:  { vc: 200, f: 0.20, ap: 2.0 },
  steel_hard:  { vc: 130, f: 0.15, ap: 1.5 },
  stainless:   { vc: 120, f: 0.15, ap: 1.5 },
  aluminum:    { vc: 400, f: 0.30, ap: 3.0 },
  brass:       { vc: 300, f: 0.25, ap: 2.5 },
  cast_iron:   { vc: 150, f: 0.20, ap: 2.0 },
  plastic:     { vc: 500, f: 0.30, ap: 3.0 },
}

const EXAMPLE_PROFILE: ProfilePoint[] = [
  { x: 0,  z: 0,    move: 'G00', r: 0 },
  { x: 30, z: 0,    move: 'G01', r: 0 },
  { x: 30, z: -20,  move: 'G01', r: 2 },
  { x: 40, z: -20,  move: 'G01', r: 0 },
  { x: 40, z: -50,  move: 'G01', r: 0 },
  { x: 50, z: -50,  move: 'G02', r: 5 },
  { x: 50, z: -90,  move: 'G01', r: 0 },
  { x: 60, z: -90,  move: 'G01', r: 0 },
  { x: 60, z: -110, move: 'G01', r: 0 },
]

const INITIAL_OPS: Op[] = [
  { id: 'face',      name: 'Yüz Tornalama',       desc: 'Alın düzeltme (G72)',          gcode: 'G72', checked: true  },
  { id: 'rough_od',  name: 'Kaba Dış Tornalama',  desc: 'Çevrim döngüsü (G71)',         gcode: 'G71', checked: true  },
  { id: 'finish_od', name: 'İnce Dış Tornalama',  desc: 'Son paso (G70)',               gcode: 'G70', checked: true  },
  { id: 'bore',      name: 'İç Çap Tornalama',    desc: 'Boring döngüsü (G71)',         gcode: 'G71', checked: false },
  { id: 'drill',     name: 'Matkap Delme',         desc: 'Kırıklı delme (G83)',          gcode: 'G83', checked: false },
  { id: 'groove',    name: 'Kanal Açma',           desc: 'Kanal döngüsü (G75)',          gcode: 'G75', checked: false },
  { id: 'thread',    name: 'Diş Açma',             desc: 'Metrik diş döngüsü (G76)',     gcode: 'G76', checked: false },
  { id: 'cutoff',    name: 'Kesme / Koparma',      desc: 'Parça koparma (G01)',          gcode: 'G01', checked: false },
]

/* ─── G-Code Highlight ───────────────────────────────────────────────────── */
function highlight(line: string): string {
  const e = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  if (line.startsWith(';'))  return `<span class="gc-comment">${e(line)}</span>`
  if (!line.trim() || line.trim() === '%') return `<span class="gc-hdr">${e(line)}</span>`
  if (/^O\d/.test(line))    return `<span class="gc-param">${e(line)}</span>`
  let c = e(line)
  c = c.replace(/\b(T\d{4})\b/g,   '<span class="gc-tool">$1</span>')
  c = c.replace(/\b(G00)\b/g,       '<span class="gc-rapid">$1</span>')
  c = c.replace(/\b(G0[123])\b/g,   '<span class="gc-feed">$1</span>')
  c = c.replace(/\b(G(?:50|70|71|72|75|76|80|83|96|97|21|18|40))\b/g, '<span class="gc-cycle">$1</span>')
  c = c.replace(/\b(M0[3-9]|M30)\b/g, '<span class="gc-spindle">$1</span>')
  c = c.replace(/([XZUF])([-\d.]+)/g, '<span class="gc-coord">$1</span><span class="gc-param">$2</span>')
  c = c.replace(/\b(N\d+)\b/g,       '<span class="gc-hdr">$1</span>')
  c = c.replace(/(;.*)$/,             '<span class="gc-comment">$1</span>')
  return c
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function TornaPage() {
  // Params
  const [material,   setMaterial]   = useState('steel_mild')
  const [stockD,     setStockD]     = useState(60)
  const [stockL,     setStockL]     = useState(120)
  const [vc,         setVc]         = useState(200)
  const [feed,       setFeed]       = useState(0.2)
  const [ap,         setAp]         = useState(2.0)
  const [finishAl,   setFinishAl]   = useState(0.3)
  const [safeZ,      setSafeZ]      = useState(5)
  const [progNum,    setProgNum]    = useState('O1001')
  const [controller, setController] = useState('fanuc')
  const [coolant,    setCoolant]    = useState('M08')

  // Profile
  const [profile, setProfile]       = useState<ProfilePoint[]>(EXAMPLE_PROFILE)
  const [ops,     setOps]           = useState<Op[]>(INITIAL_OPS)

  // Output
  const [gcode,      setGcode]      = useState('')
  const [statLines,  setStatLines]  = useState(0)
  const [statTime,   setStatTime]   = useState(0)
  const [statOps,    setStatOps]    = useState(0)
  const [statTools,  setStatTools]  = useState(0)

  // UI
  const [coordTxt,   setCoordTxt]   = useState('X: 0.00   Z: 0.00')
  const [uploadSrc,  setUploadSrc]  = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfProgress,setPdfProgress]= useState(0)
  const [pdfInfo,    setPdfInfo]    = useState('')
  const [copyLabel,  setCopyLabel]  = useState('📋 Kopyala')
  const [isDrag,     setIsDrag]     = useState(false)

  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const gcodeRef   = useRef<HTMLDivElement>(null)

  /* ─ Material auto-fill ─ */
  const onMaterialChange = (val: string) => {
    setMaterial(val)
    const p = MAT_PARAMS[val]
    if (p) { setVc(p.vc); setFeed(p.f); setAp(p.ap) }
  }

  /* ─ Canvas draw ─ */
  const drawCanvas = useCallback(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    const W = cvs.width, H = cvs.height
    const scale = 3.2
    const ox = 65, oy = H / 2 + 30

    const toC = (x: number, z: number) => ({ cx: ox + (-z) * scale, cy: oy - (x / 2) * scale })

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#060c1a'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(30,45,79,.6)'; ctx.lineWidth = .5
    const gs = 10 * scale
    for (let x = ox % gs; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y = oy % gs; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

    // Axes
    ctx.strokeStyle = 'rgba(71,85,105,.7)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(ox,0); ctx.lineTo(ox,H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0,oy); ctx.lineTo(W,oy); ctx.stroke()
    ctx.fillStyle='#374151'; ctx.font='10px Inter'
    ctx.fillText('Z→', W-22, oy-5); ctx.fillText('X↑', ox+4, 14)

    // Scale ticks
    ctx.fillStyle='#2d3748'; ctx.font='8px JetBrains Mono'
    for(let mm=0;mm<=200;mm+=20){
      const cx=ox+mm*scale
      ctx.fillText(`-${mm}`, cx-8, oy+12)
      ctx.beginPath(); ctx.strokeStyle='rgba(71,85,105,.4)'
      ctx.moveTo(cx,oy-3); ctx.lineTo(cx,oy+3); ctx.stroke()
    }
    for(let mm=0;mm<=120;mm+=10){
      const cy=oy-mm*scale/2
      ctx.fillStyle='#2d3748'; ctx.fillText(`${mm*2}`, ox-30, cy+3)
    }

    // Stock
    const s0=toC(stockD,0), sL=toC(0,-stockL)
    const sw=Math.abs(s0.cx-sL.cx), sh=Math.abs(s0.cy-oy)
    ctx.fillStyle='rgba(16,185,129,.05)'; ctx.strokeStyle='rgba(16,185,129,.25)'
    ctx.lineWidth=1.5; ctx.setLineDash([4,4])
    ctx.fillRect(ox,oy-sh,sw,sh)
    ctx.strokeRect(ox,oy-sh,sw,sh)
    ctx.setLineDash([])

    if (profile.length < 2) return

    // Profile top
    ctx.strokeStyle='#ef4444'; ctx.lineWidth=2.5
    ctx.shadowColor='#ef4444'; ctx.shadowBlur=6
    ctx.beginPath()
    profile.forEach((p, i) => {
      const {cx,cy}=toC(p.x,p.z)
      i===0 ? ctx.moveTo(cx,cy) : ctx.lineTo(cx,cy)
    })
    ctx.stroke()

    // Fill
    ctx.beginPath()
    const fp=toC(profile[0].x,profile[0].z)
    ctx.moveTo(fp.cx,oy)
    profile.forEach(p => { const {cx,cy}=toC(p.x,p.z); ctx.lineTo(cx,cy) })
    const lp=toC(profile[profile.length-1].x,profile[profile.length-1].z)
    ctx.lineTo(lp.cx,oy); ctx.closePath()
    ctx.fillStyle='rgba(239,68,68,.06)'; ctx.fill()

    // Mirror bottom
    ctx.strokeStyle='rgba(239,68,68,.3)'; ctx.lineWidth=1.5; ctx.shadowBlur=0
    ctx.beginPath()
    profile.forEach((p,i)=>{
      const {cx,cy}=toC(p.x,p.z)
      const my=oy+(oy-cy)
      i===0?ctx.moveTo(cx,my):ctx.lineTo(cx,my)
    })
    ctx.stroke()

    // Points
    profile.forEach((p,i)=>{
      const {cx,cy}=toC(p.x,p.z)
      ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2)
      ctx.fillStyle=i===0?'#10b981':'#3b82f6'
      ctx.shadowColor=i===0?'#10b981':'#3b82f6'; ctx.shadowBlur=8
      ctx.fill(); ctx.shadowBlur=0
      ctx.fillStyle='#94a3b8'; ctx.font='8px JetBrains Mono'
      ctx.fillText(`P${i+1}`, cx+5, cy-5)
    })
  }, [profile, stockD, stockL])

  useEffect(() => { drawCanvas() }, [drawCanvas])

  /* ─ Canvas interactions ─ */
  const canvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current!
    const rect = cvs.getBoundingClientRect()
    const sx = cvs.width / rect.width, sy = cvs.height / rect.height
    const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy
    const scale = 3.2, ox = 65, oy = cvs.height / 2 + 30
    const z = -(cx - ox) / scale, x = ((oy - cy) / scale) * 2
    setCoordTxt(`X: ${x.toFixed(2).padStart(7)}  Z: ${z.toFixed(2).padStart(8)}`)
  }

  const canvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current!
    const rect = cvs.getBoundingClientRect()
    const sx = cvs.width / rect.width, sy = cvs.height / rect.height
    const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy
    const scale = 3.2, ox = 65, oy = cvs.height / 2 + 30
    const z = -(cx - ox) / scale, x = ((oy - cy) / scale) * 2
    if (x < 0 || z > 0) return
    setProfile(prev => [...prev, { x: parseFloat(x.toFixed(2)), z: parseFloat(z.toFixed(2)), move: 'G01', r: 0 }])
  }

  /* ─ File upload (image + PDF) ─ */
  const handleFile = async (file: File) => {
    if (file.type === 'application/pdf') {
      await parsePdf(file)
    } else if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setUploadSrc(url)
      setPdfInfo(`📷 ${file.name}`)
    }
  }

  const parsePdf = async (file: File) => {
    setPdfLoading(true); setPdfProgress(10); setPdfInfo('PDF yükleniyor...')
    try {
      // Load pdf.js from CDN dynamically
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          s.onload = () => resolve(); s.onerror = reject
          document.head.appendChild(s)
        })
        ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }
      setPdfProgress(30)
      const ab = await file.arrayBuffer()
      const pdf = await (window as any).pdfjsLib.getDocument({ data: ab }).promise
      setPdfProgress(60); setPdfInfo(`PDF: ${pdf.numPages} sayfa bulundu`)

      // Render first page to canvas → show as preview
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.5 })
      const tmpCvs = document.createElement('canvas')
      tmpCvs.width = viewport.width; tmpCvs.height = viewport.height
      await page.render({ canvasContext: tmpCvs.getContext('2d')!, viewport }).promise
      setUploadSrc(tmpCvs.toDataURL())
      setPdfProgress(100)
      setPdfInfo(`✅ ${file.name} — Koordinatları aşağıdan manuel girin`)
    } catch {
      setPdfInfo('⚠️ PDF okunamadı. PNG/JPG olarak kaydedin.')
    } finally {
      setPdfLoading(false)
    }
  }

  /* ─ Profile table helpers ─ */
  const updatePoint = (i: number, field: keyof ProfilePoint, val: string | number) => {
    setProfile(prev => {
      const np = [...prev]
      np[i] = { ...np[i], [field]: field === 'move' ? val : parseFloat(String(val)) || 0 }
      return np
    })
  }

  const removePoint = (i: number) =>
    setProfile(prev => prev.filter((_, idx) => idx !== i))

  const addPoint = () =>
    setProfile(prev => [...prev, { x: 0, z: 0, move: 'G01', r: 0 }])

  /* ─ G-Code generation ─ */
  const generateGCode = () => {
    if (profile.length < 2) { alert('En az 2 kontur noktası girin!'); return }

    const activeOps = ops.filter(o => o.checked)
    const rpmMax = Math.round((vc * 1000) / (Math.PI * Math.max(...profile.map(p=>p.x).filter(x=>x>0), 10)))
    const now = new Date()
    const dateStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})
    const matLabel = { steel_mild:'C45 Yumuşak Çelik', steel_hard:'42CrMo4 Sert Çelik', stainless:'Paslanmaz 304', aluminum:'Alüminyum 6061', brass:'Pirinç', cast_iron:'Dökme Demir', plastic:'Plastik' }[material] || material

    const lines: string[] = []
    const push = (...args: string[]) => lines.push(...args)

    push(
      `; ════════════════════════════════════════════════`,
      `; PROGRAM : ${progNum}`,
      `; Tarih   : ${dateStr}`,
      `; Malzeme : ${matLabel}`,
      `; Ham     : Ø${stockD} mm x ${stockL} mm`,
      `; Kesme   : Vc=${vc} m/dak | f=${feed} mm/dev | ap=${ap} mm`,
      `; Kontrolcü: ${controller.toUpperCase()}`,
      `; ════════════════════════════════════════════════`,
      ``, progNum,
      `G21 G18 G40 G80     ; Metrik, XZ düzlemi`,
      `G50 S${rpmMax}          ; Maks dev/dak ${rpmMax}`,
      `G96 S${vc} M03       ; Sabit yüzey hızı ${vc} m/dak`,
      ``
    )

    let opCount = 0, toolCount = 0

    // Face
    if (activeOps.find(o=>o.id==='face')) {
      opCount++; toolCount++
      push(
        `; ─── OP${opCount}: YÜZ TORNALAMA ─────────────────`,
        `T0101 M06            ; T1 - Alın kalem`,
        `${coolant}`,
        `G00 X${stockD+5} Z${safeZ}`,
        `G00 X${stockD+2} Z0.5`,
        `G01 X-1.0 F${(feed*.8).toFixed(3)}`,
        `G00 Z${safeZ}`,
        `G00 X${stockD+5}`,
        ``
      )
    }

    // Drilling
    if (activeOps.find(o=>o.id==='drill')) {
      opCount++; toolCount++
      const dd=15, dep=Math.min(stockL*.6,80)
      push(
        `; ─── OP${opCount}: MATKAP DELME ───────────────────`,
        `T0202 M06            ; T2 - Matkap Ø${dd}mm`,
        `G97 S${Math.round(vc*1000/(Math.PI*dd))} M03`,
        `G00 X0 Z${safeZ}`,
        `G83 X0 Z-${dep.toFixed(1)} Q3000 F${(feed*.5).toFixed(3)}`,
        `G80`,
        `G00 Z${safeZ}`,
        `G96 S${vc} M03`,
        ``
      )
    }

    // Rough OD
    if (activeOps.find(o=>o.id==='rough_od')) {
      opCount++; toolCount++
      push(
        `; ─── OP${opCount}: KABA DIŞ TORNALAMA (G71) ────────`,
        `T0303 M06            ; T3 - Dış kalem TNMG`,
        `${coolant}`,
        `G96 S${vc} M03`,
        `G00 X${stockD+5} Z${safeZ}`,
        `G00 X${stockD+2} Z1.0`,
        `G71 U${ap.toFixed(2)} R0.5`,
        `G71 P100 Q200 U${finishAl.toFixed(3)} W${(finishAl/2).toFixed(3)} F${feed.toFixed(3)}`,
        ``
      )
      push(`N100 G00 X${profile[0].x.toFixed(2)} Z1.0`)
      profile.forEach((p, i) => {
        let ext = ''
        if ((p.move==='G02'||p.move==='G03') && p.r>0) ext=` R${p.r.toFixed(2)}`
        else if (p.move==='G01' && p.r!==0) ext=` ${p.r>0?'C':'R'}${Math.abs(p.r).toFixed(2)}`
        const ln = i<profile.length-1 ? `N${110+i*10} ` : 'N200 '
        push(`${ln}${p.move} X${p.x.toFixed(2)} Z${p.z.toFixed(2)}${ext} F${feed.toFixed(3)}`)
      })
      push(``)
    }

    // Finish OD
    if (activeOps.find(o=>o.id==='finish_od')) {
      opCount++
      push(
        `; ─── OP${opCount}: İNCE DIŞ TORNALAMA (G70) ────────`,
        `G96 S${Math.round(vc*1.2)} M03`,
        `G70 P100 Q200 F${(feed*.6).toFixed(3)}`,
        `G00 X${stockD+10} Z${safeZ}`,
        ``
      )
    }

    // Groove
    if (activeOps.find(o=>o.id==='groove')) {
      opCount++; toolCount++
      const maxX=Math.max(...profile.map(p=>p.x))
      push(
        `; ─── OP${opCount}: KANAL AÇMA (G75) ─────────────`,
        `T0404 M06            ; T4 - Kanal kalemi 3mm`,
        `G97 S${Math.round((vc*1000)/(Math.PI*maxX)*.7)} M03`,
        `G00 X${maxX+5} Z${safeZ}`,
        `G00 X${maxX+2} Z-${(stockL*.4).toFixed(1)}`,
        `G75 R0.5`,
        `G75 X${(maxX-10).toFixed(1)} Z-${(stockL*.4).toFixed(1)} P2000 Q3000 F${(feed*.5).toFixed(3)}`,
        `G00 X${maxX+10}`,
        `G00 Z${safeZ}`,
        ``
      )
    }

    // Thread
    if (activeOps.find(o=>o.id==='thread')) {
      opCount++; toolCount++
      const td=Math.max(...profile.map(p=>p.x)), pitch=1.5, tdep=pitch*.6495
      push(
        `; ─── OP${opCount}: DİŞ AÇMA (G76) ─────────────────`,
        `T0505 M06            ; T5 - Diş kalemi 60°`,
        `G97 S${Math.round((vc*1000)/(Math.PI*td)*.5)} M03`,
        `G00 X${td+5} Z${safeZ}`,
        `G00 X${td+2} Z4.0`,
        `G76 P020060 Q100 R0.05`,
        `G76 X${(td-tdep*2).toFixed(3)} Z-${Math.min(stockL*.3,30).toFixed(1)} R0 P${Math.round(tdep*1000)} Q300 F${pitch.toFixed(3)}`,
        `G00 X${td+10}`,
        `G00 Z${safeZ}`,
        ``
      )
    }

    // Cutoff
    if (activeOps.find(o=>o.id==='cutoff')) {
      opCount++; toolCount++
      push(
        `; ─── OP${opCount}: KESME / KOPARMA ──────────────`,
        `T0707 M06            ; T7 - Kesme kalemi`,
        `G97 S${Math.round((vc*1000)/(Math.PI*stockD)*.6)} M03`,
        `G00 X${stockD+5} Z-${(stockL-1).toFixed(1)}`,
        `G01 X-0.5 F${(feed*.3).toFixed(3)}`,
        `G00 X${stockD+10}`,
        `G00 Z${safeZ}`,
        ``
      )
    }

    push(
      `; ─── PROGRAM SONU ───────────────────────────────`,
      `M09                  ; Soğutma kapat`,
      `G00 X200.0 Z200.0`,
      `M05                  ; Mil dur`,
      `M30                  ; Program sonu`,
      `%`
    )

    const full = lines.join('\n')
    setGcode(full)
    setStatLines(lines.length)
    setStatOps(opCount)
    setStatTools(toolCount)
    setStatTime(Math.round(profile.length * stockL * 0.015 / feed + opCount * 3))

    if (gcodeRef.current) {
      gcodeRef.current.innerHTML = lines.map(highlight).join('\n')
      gcodeRef.current.scrollTop = 0
    }
  }

  const copyGCode = () => {
    if (!gcode) { alert('Önce G-Code üretin!'); return }
    navigator.clipboard.writeText(gcode).then(() => {
      setCopyLabel('✅ Kopyalandı')
      setTimeout(() => setCopyLabel('📋 Kopyala'), 2000)
    })
  }

  const downloadGCode = () => {
    if (!gcode) { alert('Önce G-Code üretin!'); return }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([gcode], { type: 'text/plain' }))
    a.download = `${progNum.replace(/[^a-zA-Z0-9]/g,'_')}.nc`
    a.click()
  }

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">

        {/* HEADER */}
        <header>
          <div className="logo">
            <div className="logo-icon">⚙️</div>
            <div>
              <h1>CNC Torna G-Code Üretici</h1>
              <p>Teknik Resimden Otomatik G-Code — knowledge-arena.xyz/beyaz/torna</p>
            </div>
          </div>
          <div className="badges">
            <span className="badge b-blue">Fanuc Uyumlu</span>
            <span className="badge b-green">Siemens 840D</span>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid">

          {/* ── LEFT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Upload */}
            <div className="panel">
              <div className="ph">
                <div className="ph-icon ic-blue">📐</div>
                <div><div className="pt">Teknik Resim / PDF</div><div className="ps">PNG, JPG, PDF desteklenir</div></div>
              </div>
              <div className="pb">
                <div
                  className={`upload${isDrag?' drag':''}`}
                  onClick={() => document.getElementById('file-input')?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
                  onDragLeave={() => setIsDrag(false)}
                  onDrop={e => { e.preventDefault(); setIsDrag(false); const f=e.dataTransfer.files[0]; if(f) handleFile(f) }}
                >
                  <input id="file-input" type="file" accept="image/*,.pdf"
                    onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
                  {uploadSrc
                    ? <img src={uploadSrc} alt="Yüklenen resim" className="upload-preview" style={{ display:'block' }} />
                    : (<><div className="upload-icon">🖼️</div>
                       <div className="upload-title">Teknik Resim veya PDF Yükle</div>
                       <div className="upload-sub">tıkla veya sürükle bırak</div></>)
                  }
                  {pdfLoading && (
                    <div className="progress" style={{ marginTop:8 }}>
                      <div className="progress-bar" style={{ width:`${pdfProgress}%` }} />
                    </div>
                  )}
                  {pdfInfo && <span className="pdf-badge">{pdfInfo}</span>}
                </div>
                <div className="alert alert-info" style={{ marginTop:10, marginBottom:0 }}>
                  <span>ℹ️</span>
                  <span>PDF yüklendiğinde ilk sayfa önizleme olarak gösterilir. Koordinatları aşağıdan manuel girin.</span>
                </div>
              </div>
            </div>

            {/* Material & Machine */}
            <div className="panel">
              <div className="ph">
                <div className="ph-icon ic-orange">⚙️</div>
                <div><div className="pt">Malzeme & Tezgah</div><div className="ps">İş parçası ve kesme parametreleri</div></div>
              </div>
              <div className="pb">
                <div className="fg">
                  <label>Malzeme Tipi</label>
                  <select value={material} onChange={e=>onMaterialChange(e.target.value)}>
                    <option value="steel_mild">Yumuşak Çelik (C45)</option>
                    <option value="steel_hard">Sert Çelik (42CrMo4)</option>
                    <option value="stainless">Paslanmaz Çelik (304)</option>
                    <option value="aluminum">Alüminyum (6061)</option>
                    <option value="brass">Pirinç</option>
                    <option value="cast_iron">Dökme Demir</option>
                    <option value="plastic">Plastik / Delrin</option>
                  </select>
                </div>
                <div className="fr">
                  <div className="fg"><label>Ham Çap (mm)</label>
                    <input type="number" value={stockD} onChange={e=>setStockD(Number(e.target.value))} min={1} max={500} step={0.1} /></div>
                  <div className="fg"><label>Ham Uzunluk (mm)</label>
                    <input type="number" value={stockL} onChange={e=>setStockL(Number(e.target.value))} min={1} max={2000} step={0.1} /></div>
                </div>
                <div className="sec">Kesme Parametreleri</div>
                <div className="fr">
                  <div className="fg"><label>Kesme Hızı Vc (m/dak)</label>
                    <input type="number" value={vc} onChange={e=>setVc(Number(e.target.value))} min={10} max={1000} /></div>
                  <div className="fg"><label>İlerleme f (mm/dev)</label>
                    <input type="number" value={feed} onChange={e=>setFeed(Number(e.target.value))} min={0.01} max={2} step={0.01} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label>Paso Derinliği ap (mm)</label>
                    <input type="number" value={ap} onChange={e=>setAp(Number(e.target.value))} min={0.1} max={10} step={0.1} /></div>
                  <div className="fg"><label>Son İşlem Payı (mm)</label>
                    <input type="number" value={finishAl} onChange={e=>setFinishAl(Number(e.target.value))} min={0} max={2} step={0.05} /></div>
                </div>
                <div className="sec">CNC Kontrolcü</div>
                <div className="fr">
                  <div className="fg"><label>Kontrolcü</label>
                    <select value={controller} onChange={e=>setController(e.target.value)}>
                      <option value="fanuc">Fanuc 0i/21i</option>
                      <option value="fanuc_oi_tf">Fanuc 0i-TF</option>
                      <option value="siemens">Siemens 840D sl</option>
                      <option value="haas">Haas NGC</option>
                    </select></div>
                  <div className="fg"><label>Soğutma</label>
                    <select value={coolant} onChange={e=>setCoolant(e.target.value)}>
                      <option value="M08">Su Bazlı (M08)</option>
                      <option value="M07">Sis (M07)</option>
                      <option value="M09">Yok (M09)</option>
                    </select></div>
                </div>
                <div className="fr">
                  <div className="fg"><label>Güvenli Z (mm)</label>
                    <input type="number" value={safeZ} onChange={e=>setSafeZ(Number(e.target.value))} min={1} max={50} step={0.5} /></div>
                  <div className="fg"><label>Program No</label>
                    <input type="text" value={progNum} onChange={e=>setProgNum(e.target.value)} placeholder="O1001" /></div>
                </div>
              </div>
            </div>

            {/* Operations */}
            <div className="panel">
              <div className="ph">
                <div className="ph-icon ic-green">🔧</div>
                <div><div className="pt">Torna Operasyonları</div><div className="ps">Dahil edilecekleri seçin</div></div>
              </div>
              <div className="pb">
                {ops.map((op, i) => (
                  <div key={op.id} className={`op-item${op.checked?' sel':''}`}
                    onClick={() => setOps(prev => prev.map((o,j)=>j===i?{...o,checked:!o.checked}:o))}>
                    <input type="checkbox" checked={op.checked} readOnly />
                    <div className="op-label">
                      <div className="op-name">{op.name}</div>
                      <div className="op-desc">{op.desc}</div>
                    </div>
                    <span className="op-badge">{op.gcode}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CENTER ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Canvas */}
            <div className="canvas-wrap">
              <div className="ctb">
                <div className="ctb-title">📊 Profil Düzenleyici & Simülasyon</div>
                <span className="coord">{coordTxt}</span>
                <button className="btn btn-outline btn-sm" onClick={() => { setProfile([]); }}>🗑️</button>
                <button className="btn btn-outline btn-sm" onClick={() => setProfile(prev => prev.slice(0,-1))}>↩️</button>
                <button className="btn btn-outline btn-sm" onClick={() => setProfile(EXAMPLE_PROFILE)}>📁 Örnek</button>
              </div>
              <canvas ref={canvasRef} width={760} height={400}
                onMouseMove={canvasMove} onClick={canvasClick} />
              <div className="cinfo">
                <span><span className="dot" style={{background:'#3b82f6'}}/>Kontur</span>
                <span><span className="dot" style={{background:'#10b981'}}/>Ham Malzeme</span>
                <span><span className="dot" style={{background:'#ef4444'}}/>Son Form</span>
                <span style={{ marginLeft:'auto' }}>📍 {profile.length} nokta</span>
              </div>
            </div>

            {/* Profile table */}
            <div className="panel">
              <div className="ph">
                <div className="ph-icon ic-blue">📋</div>
                <div><div className="pt">Kontur Koordinatları</div><div className="ps">X=çap, Z=uzunluk (mm)</div></div>
                <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                  <button className="btn btn-outline btn-sm" onClick={addPoint}>+ Ekle</button>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => setProfile(prev => [...prev].sort((a,b)=>a.z-b.z))}>⇅ Z'ye Sırala</button>
                </div>
              </div>
              <div className="pb" style={{ padding:10 }}>
                <div className="tbl-wrap">
                  <table>
                    <thead><tr><th>#</th><th>X Çap</th><th>Z Uzunluk</th><th>Hareket</th><th>Pah/R</th><th></th></tr></thead>
                    <tbody>
                      {profile.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color:'#475569', paddingLeft:8 }}>{i+1}</td>
                          <td><input type="number" step={0.01} value={p.x}
                            onChange={e=>updatePoint(i,'x',e.target.value)} /></td>
                          <td><input type="number" step={0.01} value={p.z}
                            onChange={e=>updatePoint(i,'z',e.target.value)} /></td>
                          <td>
                            <select value={p.move} onChange={e=>updatePoint(i,'move',e.target.value)}>
                              <option value="G00">G00 Hızlı</option>
                              <option value="G01">G01 Kesme</option>
                              <option value="G02">G02 Yay CW</option>
                              <option value="G03">G03 Yay CCW</option>
                            </select>
                          </td>
                          <td><input type="number" step={0.01} value={p.r}
                            onChange={e=>updatePoint(i,'r',e.target.value)} /></td>
                          <td><button className="del-btn" onClick={()=>removePoint(i)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {profile.length === 0 && (
                  <p style={{ fontSize:11, color:'#475569', textAlign:'center', padding:'12px 0' }}>
                    Canvas&apos;a tıklayarak nokta ekleyin veya &quot;📁 Örnek&quot; butonunu kullanın
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Generate button */}
            <button className="btn-gen" onClick={generateGCode}>
              ⚡ G-CODE ÜRET
            </button>

            {/* Stats */}
            <div className="stats">
              <div className="stat"><div className="sv">{statLines}</div><div className="sl">Satır</div></div>
              <div className="stat"><div className="sv">{statTime}</div><div className="sl">Dk (est.)</div></div>
              <div className="stat"><div className="sv">{statOps}</div><div className="sl">Operasyon</div></div>
              <div className="stat"><div className="sv">{statTools}</div><div className="sl">Takım</div></div>
            </div>

            {/* G-Code output */}
            <div className="panel" style={{ flex:1 }}>
              <div className="ph">
                <div className="ph-icon ic-green">💾</div>
                <div><div className="pt">G-Code Çıktısı</div><div className="ps">Fanuc / Siemens uyumlu</div></div>
                <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                  <button className="btn btn-outline btn-sm" onClick={copyGCode}>{copyLabel}</button>
                  <button className="btn btn-success btn-sm" onClick={downloadGCode}>⬇️ İndir</button>
                </div>
              </div>
              <div className="pb" style={{ padding:10 }}>
                <div
                  ref={gcodeRef}
                  className="gc-out"
                  dangerouslySetInnerHTML={gcode ? undefined : { __html:
                    `<span class="gc-comment">; ─────────────────────────────────────────</span>\n` +
                    `<span class="gc-comment">; CNC Torna G-Code Üretici</span>\n` +
                    `<span class="gc-comment">;</span>\n` +
                    `<span class="gc-comment">; 1. Teknik resim veya PDF yükleyin</span>\n` +
                    `<span class="gc-comment">; 2. Kontur koordinatlarını girin</span>\n` +
                    `<span class="gc-comment">; 3. Operasyonları seçin</span>\n` +
                    `<span class="gc-comment">; 4. "G-CODE ÜRET" butonuna basın</span>\n` +
                    `<span class="gc-comment">;</span>\n` +
                    `<span class="gc-comment">; Desteklenen: G71 G70 G72 G75 G76 G83</span>\n` +
                    `<span class="gc-comment">; ─────────────────────────────────────────</span>`
                  }}
                />
              </div>
            </div>

            {/* Tool list */}
            <div className="panel">
              <div className="ph">
                <div className="ph-icon ic-purple">🔩</div>
                <div><div className="pt">Takım Listesi</div></div>
              </div>
              <div className="pb" style={{ padding:10 }}>
                {ops.filter(o=>o.checked).length === 0
                  ? <p style={{ fontSize:11, color:'#475569', textAlign:'center', padding:'10px 0' }}>Operasyon seçin</p>
                  : ops.filter(o=>o.checked).map((op, i) => {
                    const tmap: Record<string,{num:string;name:string;tip:string}> = {
                      face:      { num:'T0101', name:'Alın Kalem',   tip:'CNMG 120408' },
                      drill:     { num:'T0202', name:'Matkap Ø15',  tip:'HSS / Karbür' },
                      rough_od:  { num:'T0303', name:'Dış Kalem',    tip:'TNMG 160408' },
                      finish_od: { num:'T0303', name:'Dış Kalem',    tip:'TNMG 160408 — aynı' },
                      groove:    { num:'T0404', name:'Kanal Kalemi', tip:'3mm Genişlik' },
                      thread:    { num:'T0505', name:'Diş Kalemi',   tip:'60° ISO Profil' },
                      bore:      { num:'T0606', name:'İç Kalem',     tip:'CCMT 060204' },
                      cutoff:    { num:'T0707', name:'Kesme Kalemi', tip:'3mm Genişlik' },
                    }
                    const t = tmap[op.id]
                    if (!t) return null
                    return (
                      <div key={i} className="tool-row">
                        <span className="tool-num">{t.num}</span>
                        <div><div className="tool-name">{t.name}</div><div className="tool-tip">{t.tip}</div></div>
                        <span style={{ marginLeft:'auto', fontSize:9, color:'#10b981', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', padding:'2px 7px', borderRadius:4 }}>AKTİF</span>
                      </div>
                    )
                  })
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
