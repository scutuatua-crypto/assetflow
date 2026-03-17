import { YIELDS, SITE } from '../data'
import { Card, Badge, Btn } from '../components'

export default function Yields() {
  const avgApy = (YIELDS.reduce((s,y)=>s+y.apy,0)/YIELDS.length).toFixed(1)
  const stakeAmount = 6000
  const monthlyIncome = ((stakeAmount * (avgApy/100)) / 12).toFixed(0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontFamily:'var(--sans)', fontSize:22, fontWeight:700 }}>🚚 WhaleTrucker Yields</h2>
        <div style={{ display:'flex', gap:8 }}>
          <Btn href={SITE.yields} target="_blank" variant="ghost" style={{ fontSize:12 }}>Yields Page →</Btn>
          <Btn href={SITE.whaletrucker} target="_blank" variant="ghost" style={{ fontSize:12 }}>Full Site →</Btn>
        </div>
      </div>

      {/* Passive Income Calculator */}
      <div style={{
        background:'linear-gradient(135deg,#0D1A12,#0A130D)',
        border:'1px solid #1A3A24', borderRadius:16, padding:24,
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16,
        animation:'fadeUp .3s ease',
      }}>
        {[
          { label:'Avg APY', value:`${avgApy}%`, color:'#10B981', icon:'📈' },
          { label:'Monthly Income', value:`~$${monthlyIncome}`, color:'#10B981', icon:'💰', sub:`on $${stakeAmount.toLocaleString()} stake` },
          { label:'Annual Yield', value:`~$${(stakeAmount*(avgApy/100)).toFixed(0)}`, color:'#F3BA2F', icon:'🎯', sub:'passive income' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:24, color:s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:11, color:'var(--muted2)', marginTop:2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Protocol list */}
      {YIELDS.map((p, i) => (
        <Card key={p.name} delay={i * .07} glow={p.color}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{
                width:44, height:44, borderRadius:12,
                background:`${p.color}18`, border:`1px solid ${p.color}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, color:p.color, fontSize:16,
              }}>{p.icon}</div>
              <div>
                <div style={{ fontFamily:'var(--sans)', fontWeight:600, fontSize:15 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:3, display:'flex', alignItems:'center', gap:8 }}>
                  <span>{p.asset}</span>
                  <span style={{ color:'var(--border2)' }}>·</span>
                  <span>TVL {p.tvl}</span>
                  <span style={{ color:'var(--border2)' }}>·</span>
                  <span style={{
                    background:`${p.color}18`, color:p.color,
                    padding:'1px 6px', borderRadius:4, fontSize:10,
                  }}>{p.chain}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <Badge color={p.risk==='Low' ? '#10B981' : '#F3BA2F'}>{p.risk} Risk</Badge>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:24, color:p.color }}>
                  {p.apy}%
                </div>
                <div style={{ fontSize:11, color:'var(--muted2)' }}>APY</div>
              </div>
              <Btn variant="primary" style={{ fontSize:12 }}>Invest →</Btn>
            </div>
          </div>
        </Card>
      ))}

      {/* Link to Dune monitoring */}
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:16, padding:20,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        animation:'fadeUp .4s ease .35s both',
      }}>
        <div>
          <div style={{ fontFamily:'var(--sans)', fontWeight:600, marginBottom:4 }}>📊 Monitor via Dune Analytics</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>
            ERC20 Contract Balance & Flow · @scutua query
          </div>
        </div>
        <Btn href={SITE.dune} target="_blank" variant="ghost" style={{ fontSize:12 }}>Open Dune →</Btn>
      </div>
    </div>
  )
}
