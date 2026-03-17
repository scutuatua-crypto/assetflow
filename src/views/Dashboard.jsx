import { ASSETS, SITE } from '../data'
import { Sparkline, Card, Badge, Btn, Stat } from '../components'

export default function Dashboard({ rules }) {
  const total = ASSETS.reduce((s, a) => s + a.value, 0)
  const totalChange = ASSETS.reduce((s, a) => s + (a.value * a.change / 100), 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#13131A 0%,#1A1228 50%,#13131A 100%)',
        border: '1px solid #2D2D50',
        borderRadius: 20, padding: 28,
        position: 'relative', overflow: 'hidden',
        animation: 'fadeUp .3s ease',
      }}>
        {/* top shimmer line */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:1,
          background:'linear-gradient(90deg,transparent,var(--accent),transparent)',
        }}/>
        {/* scanline */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:20 }}>
          <div style={{
            position:'absolute', width:'100%', height:2,
            background:'linear-gradient(90deg,transparent,rgba(124,106,247,.12),transparent)',
            animation:'scanline 5s linear infinite',
          }}/>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
              Total Portfolio
            </div>
            <div style={{ fontFamily:'var(--sans)', fontSize:38, fontWeight:700, letterSpacing:'-.03em', lineHeight:1 }}>
              ${total.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
            <div style={{ marginTop:8, fontSize:13, color:'#10B981', display:'flex', alignItems:'center', gap:6 }}>
              <span>▲</span>
              <span>+${totalChange.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              <span style={{ color:'rgba(255,255,255,.3)' }}>today</span>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, minWidth:280 }}>
            <Stat label="Assets"    value={ASSETS.length} />
            <Stat label="Active Rules" value={`${rules.filter(r=>r.active).length}/${rules.length}`} />
            <Stat label="This Month" value="+12.3%" color="#10B981" />
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        {ASSETS.map((a, i) => (
          <Card key={a.id} delay={i * .07} glow={a.color}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:40, height:40, borderRadius:12,
                  background:`${a.color}18`, border:`1px solid ${a.color}35`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, color:a.color, fontWeight:700,
                }}>{a.icon}</div>
                <div>
                  <div style={{ fontFamily:'var(--sans)', fontWeight:600, fontSize:14 }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{a.symbol}</div>
                </div>
              </div>
              <Sparkline positive={a.change > 0} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:20 }}>
                  ${a.value.toLocaleString('en',{maximumFractionDigits:2})}
                </div>
                <div style={{ fontSize:11, color:'var(--muted2)', marginTop:2 }}>
                  {a.amount.toLocaleString()} {a.symbol}
                </div>
              </div>
              <Badge color={a.change > 0 ? '#10B981' : '#EF4444'}>
                {a.change > 0 ? '▲' : '▼'} {Math.abs(a.change)}%
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* USUAL Banner */}
      <div style={{
        background:'linear-gradient(135deg,#1A0E2E,#130D1F)',
        border:'1px solid #4C1D95', borderRadius:16, padding:20,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        flexWrap:'wrap', gap:12,
        animation:'fadeUp .4s ease .2s both',
      }}>
        <div>
          <div style={{ fontSize:11, color:'#8B5CF6', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>
            🐋 USUAL Unlock Monitor · czonedive-core
          </div>
          <div style={{ fontFamily:'var(--sans)', fontSize:24, fontWeight:700 }}>
            1,510,000 <span style={{ color:'#8B5CF6' }}>USUAL</span>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
            ≈ $39,870.55 · @scutua · Market Rate: $0.0264
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn href={SITE.czonedive} target="_blank" variant="ghost">Tracker →</Btn>
          <Btn href="https://app.usual.money" target="_blank" variant="primary">Claim 🎁</Btn>
        </div>
      </div>

      {/* Dune Banner */}
      <div style={{
        background:'#0D0D14', border:'1px solid var(--border)',
        borderRadius:16, padding:20,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        flexWrap:'wrap', gap:12,
        animation:'fadeUp .4s ease .3s both',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:40, height:40, borderRadius:10,
            background:'#FF6B2B18', border:'1px solid #FF6B2B30',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
          }}>📊</div>
          <div>
            <div style={{ fontFamily:'var(--sans)', fontWeight:600 }}>Dune Analytics · ERC20 Monitor</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
              Contract Balance & Flow · UNI · Ethereum · 7d
            </div>
          </div>
        </div>
        <Btn href={SITE.dune} target="_blank" variant="ghost">View Query →</Btn>
      </div>

    </div>
  )
}
