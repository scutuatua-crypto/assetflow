import { useState } from 'react'
import { Card, Badge, Toggle, Btn, Input, Select } from '../components'

export default function AutoRules({ rules, setRules }) {
  const [form, setForm] = useState({ asset:'', freq:'', amount:'' })
  const [added, setAdded] = useState(false)

  const toggle = (id) => setRules(r => r.map(x => x.id === id ? {...x, active:!x.active} : x))

  const create = () => {
    if (!form.asset || !form.freq || !form.amount) return
    const newRule = {
      id: Date.now(),
      name: `${form.asset} ${form.freq} Auto`,
      asset: form.asset, color: '#7C6AF7',
      freq: form.freq, amount: form.amount,
      next: 'Tomorrow', active: true,
      totalRuns: 0, totalValue: '$0',
    }
    setRules(r => [...r, newRule])
    setForm({ asset:'', freq:'', amount:'' })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontFamily:'var(--sans)', fontSize:22, fontWeight:700 }}>⚡ Auto Rules</h2>
        <div style={{ fontSize:12, color:'var(--muted)' }}>
          {rules.filter(r=>r.active).length} active · {rules.length} total
        </div>
      </div>

      {rules.map((r, i) => (
        <Card key={r.id} delay={i * .08} glow={r.active ? r.color : undefined}
          style={{ opacity: r.active ? 1 : .55, transition:'opacity .2s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:38, height:38, borderRadius:10,
                background:`${r.color}18`, border:`1px solid ${r.color}35`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--sans)', fontWeight:700, color:r.color, fontSize:13,
              }}>{r.asset}</div>
              <div>
                <div style={{ fontFamily:'var(--sans)', fontWeight:600, fontSize:15 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                  Auto-receive {r.asset} · {r.freq}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Badge color={r.active ? '#10B981' : '#666680'}>
                {r.active ? 'ACTIVE' : 'PAUSED'}
              </Badge>
              <Toggle value={r.active} onChange={() => toggle(r.id)} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
            {[
              { label:'Amount',    val:r.amount },
              { label:'Frequency', val:r.freq },
              { label:'Next Run',  val:r.next },
              { label:'Total Runs',val:r.totalRuns },
              { label:'Total In',  val:r.totalValue },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--bg2)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'var(--muted2)', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" style={{ fontSize:12 }}>Edit</Btn>
            <Btn variant="ghost" style={{ fontSize:12 }} onClick={() => toggle(r.id)}>
              {r.active ? 'Pause' : 'Resume'}
            </Btn>
            <Btn variant="danger" style={{ fontSize:12 }}
              onClick={() => setRules(rx => rx.filter(x => x.id !== r.id))}>
              Remove
            </Btn>
          </div>
        </Card>
      ))}

      {/* Quick Create */}
      <div style={{
        background:'linear-gradient(135deg,#0D1A12,#0A130D)',
        border:'1px solid #1A3A24', borderRadius:16, padding:20,
        animation:'fadeUp .4s ease .3s both',
      }}>
        <div style={{ fontFamily:'var(--sans)', fontWeight:600, marginBottom:4 }}>
          ✦ Quick Create
        </div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>
          Setup a new automatic receiving rule in seconds
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10 }}>
          <Select value={form.asset} onChange={e=>setForm(f=>({...f,asset:e.target.value}))}>
            <option value="">Asset</option>
            <option>BTC</option><option>ETH</option>
            <option>USUAL</option><option>USDC</option><option>NEAR</option>
          </Select>
          <Select value={form.freq} onChange={e=>setForm(f=>({...f,freq:e.target.value}))}>
            <option value="">Frequency</option>
            <option>Daily</option><option>Weekly</option>
            <option>Monthly</option><option>On Unlock</option>
          </Select>
          <Input
            placeholder="Amount (e.g. $100)"
            value={form.amount}
            onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
          />
          <Btn variant={added ? 'green' : 'primary'} onClick={create} style={{ whiteSpace:'nowrap' }}>
            {added ? '✓ Created!' : 'Create →'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
