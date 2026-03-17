import { useState } from 'react'
import { WALLETS } from '../data'
import { Card, Badge, Btn } from '../components'

export default function ReceiveAssets() {
  const [copied, setCopied] = useState('')
  const [selected, setSelected] = useState(null)

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(()=>{})
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontFamily:'var(--sans)', fontSize:22, fontWeight:700 }}>📥 Receive Assets</h2>

      <div style={{ fontSize:12, color:'var(--muted)', padding:'10px 14px', background:'#0D1A12', border:'1px solid #1A3A24', borderRadius:10 }}>
        ⚠️ Always verify the network before sending. Sending to wrong network = lost funds.
      </div>

      {WALLETS.map((w, i) => (
        <Card key={w.name} delay={i * .08} glow={w.color}
          style={{ cursor:'pointer' }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:42, height:42, borderRadius:12,
                background:`${w.color}18`, border:`1px solid ${w.color}35`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, color:w.color, fontSize:16,
              }}>{w.icon}</div>
              <div>
                <div style={{ fontFamily:'var(--sans)', fontWeight:600, fontSize:15 }}>{w.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Deposit address</div>
              </div>
            </div>
            <Badge color={w.color}>{w.network}</Badge>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg2)', borderRadius:10, padding:'12px 14px' }}>
            <code style={{ flex:1, fontSize:12, color:'#A0A0C0', wordBreak:'break-all', lineHeight:1.5 }}>
              {w.address}
            </code>
            <Btn
              variant="ghost"
              onClick={() => copy(w.address, w.name)}
              style={{ padding:'6px 12px', fontSize:12, flexShrink:0,
                background: copied===w.name ? '#10B98120' : undefined,
                color: copied===w.name ? '#10B981' : undefined,
                borderColor: copied===w.name ? '#10B98130' : undefined,
              }}
            >
              {copied===w.name ? '✓ Copied!' : 'Copy'}
            </Btn>
          </div>

          {/* QR placeholder */}
          <div style={{
            marginTop:12, padding:14,
            background:'var(--bg2)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'1px dashed var(--border)',
            fontSize:11, color:'var(--muted2)',
          }}>
            <span>QR code — install qrcode.react for live QR</span>
          </div>
        </Card>
      ))}

      {/* Add wallet */}
      <div style={{
        background:'var(--bg2)', border:'1px dashed var(--border)',
        borderRadius:16, padding:20, textAlign:'center',
        color:'var(--muted)', fontSize:13, cursor:'pointer',
        transition:'border-color .2s, color .2s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}
      >
        + Add New Wallet Address
      </div>
    </div>
  )
}
