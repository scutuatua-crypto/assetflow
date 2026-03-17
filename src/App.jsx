import { useState, useEffect, useCallback } from “react”

/* ═══════════════════════════════════════
CONFIG
═══════════════════════════════════════ */
const SITE = {
github: ‘https://github.com/scutuatua-crypto’,
whaletrucker: ‘https://scutuatua-crypto.github.io/whaletrucker-reef/’,
czonedive: ‘https://scutuatua-crypto.github.io/czonedive-core/’,
yields: ‘http://scutuatua-crypto.github.io/whaletrucker-reef/yields.html’,
dune: ‘https://dune.com/scutua’,
telegram: ‘https://t.me/scutua01’,
remix: ‘https://remix.ethereum.org/’,
}

const TOKENS = {
USDC:  { address: ‘0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48’, decimals: 6,  symbol: ‘USDC’,  color: ‘#2775CA’ },
USUAL: { address: ‘0xC4441c2BE5d8fA8126822B9929CA0b81Ea0DE38E’, decimals: 18, symbol: ‘USUAL’, color: ‘#8B5CF6’ },
USDT:  { address: ‘0xdAC17F958D2ee523a2206206994597C13D831ec7’, decimals: 6,  symbol: ‘USDT’,  color: ‘#26A17B’ },
}

const ERC20_ABI = [
‘function balanceOf(address) view returns (uint256)’,
‘function decimals() view returns (uint8)’,
‘function symbol() view returns (string)’,
]

const WALLETS_LIST = [
{ id: ‘metamask’,      name: ‘MetaMask’,      icon: ‘🦊’, desc: ‘Browser extension’,   color: ‘#F6851B’ },
{ id: ‘walletconnect’, name: ‘WalletConnect’, icon: ‘🔗’, desc: ‘Scan with any wallet’, color: ‘#3B99FC’ },
{ id: ‘near’,          name: ‘NEAR Wallet’,   icon: ‘🌊’, desc: ‘scutua.near’,          color: ‘#00C08B’ },
{ id: ‘phantom’,       name: ‘Phantom’,       icon: ‘👻’, desc: ‘Solana wallet’,        color: ‘#AB9FF2’ },
]

const MOCK_ASSETS = [
{ id:1, symbol:‘BTC’,   name:‘Bitcoin’,     amount:0.05234,   value:2156.78,  change:5.2,  color:’#F7931A’, icon:‘₿’ },
{ id:2, symbol:‘ETH’,   name:‘Ethereum’,    amount:1.2456,    value:2890.45,  change:2.1,  color:’#627EEA’, icon:‘Ξ’ },
{ id:3, symbol:‘USUAL’, name:‘USUAL Token’, amount:1510000,   value:39870.55, change:-1.8, color:’#8B5CF6’, icon:‘U’ },
{ id:4, symbol:‘USDC’,  name:‘USD Coin’,    amount:5000,      value:5000,     change:0.01, color:’#2775CA’, icon:’$’ },
]

const INIT_RULES = [
{ id:1, name:‘BTC Weekly DCA’,        asset:‘BTC’,   color:’#F7931A’, freq:‘Weekly’,    amount:’$100’,  next:‘Tomorrow’,   active:true, totalRuns:14, totalValue:’$1,400’ },
{ id:2, name:‘ETH Monthly Stack’,     asset:‘ETH’,   color:’#627EEA’, freq:‘Monthly’,   amount:’$500’,  next:‘Mar 24’,     active:true, totalRuns:3,  totalValue:’$1,500’ },
{ id:3, name:‘USUAL Harvest Monitor’, asset:‘USUAL’, color:’#8B5CF6’, freq:‘On Unlock’, amount:‘1.51M’, next:‘Monitoring’, active:true, totalRuns:1,  totalValue:’$39,870’ },
]

const NAV = [
{ key:‘dashboard’, label:‘Dashboard’, emoji:‘📊’ },
{ key:‘rules’,     label:‘Rules’,     emoji:‘⚡’ },
{ key:‘receive’,   label:‘Receive’,   emoji:‘📥’ },
{ key:‘yields’,    label:‘Yields’,    emoji:‘🚚’ },
]

/* ═══════════════════════════════════════
WALLET HOOK
═══════════════════════════════════════ */
function useWallet() {
const [connected, setConnected]   = useState(false)
const [walletType, setWalletType] = useState(null)
const [address, setAddress]       = useState(null)
const [balances, setBalances]     = useState({})
const [loading, setLoading]       = useState(false)
const [error, setError]           = useState(null)

const fetchEVMBalances = useCallback(async (addr) => {
setLoading(true)
try {
const { ethers } = await import(‘https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.min.js’)
const provider = new ethers.BrowserProvider(window.ethereum)
const ethBal = await provider.getBalance(addr)
const tokenBals = {}
for (const [sym, tok] of Object.entries(TOKENS)) {
try {
const contract = new ethers.Contract(tok.address, ERC20_ABI, provider)
const bal = await contract.balanceOf(addr)
tokenBals[sym] = parseFloat(ethers.formatUnits(bal, tok.decimals))
} catch { tokenBals[sym] = 0 }
}
setBalances({ ETH: parseFloat(ethers.formatEther(ethBal)), …tokenBals })
} catch (e) { console.error(e) }
setLoading(false)
}, [])

const connectMetaMask = useCallback(async () => {
if (!window.ethereum) { setError(‘MetaMask not installed! Get it at metamask.io’); return }
setLoading(true); setError(null)
try {
const accounts = await window.ethereum.request({ method: ‘eth_requestAccounts’ })
setAddress(accounts[0]); setWalletType(‘metamask’); setConnected(true)
await fetchEVMBalances(accounts[0])
window.ethereum.on(‘accountsChanged’, accs => { if (!accs.length) disconnect(); else { setAddress(accs[0]); fetchEVMBalances(accs[0]) } })
} catch(e) { setError(e.message || ‘MetaMask failed’) }
setLoading(false)
}, [fetchEVMBalances])

const connectNEAR = useCallback(async () => {
setLoading(true); setError(null)
try {
const res = await fetch(‘https://rpc.mainnet.near.org’, {
method: ‘POST’, headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({ jsonrpc:‘2.0’, id:‘1’, method:‘query’, params:{ request_type:‘view_account’, finality:‘final’, account_id:‘scutua.near’ } })
})
const data = await res.json()
if (data.result) {
setAddress(‘scutua.near’); setWalletType(‘near’); setConnected(true)
setBalances({ NEAR: parseFloat(data.result.amount) / 1e24 })
} else { setError(‘NEAR account not found’) }
} catch(e) { setError(’NEAR failed: ’ + e.message) }
setLoading(false)
}, [])

const connectPhantom = useCallback(async () => {
const phantom = window.solana || window.phantom?.solana
if (!phantom?.isPhantom) { setError(‘Phantom not installed! Get it at phantom.app’); return }
setLoading(true); setError(null)
try {
const resp = await phantom.connect()
const addr = resp.publicKey.toString()
const res = await fetch(‘https://api.mainnet-beta.solana.com’, {
method: ‘POST’, headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({ jsonrpc:‘2.0’, id:1, method:‘getBalance’, params:[addr] })
})
const data = await res.json()
setAddress(addr); setWalletType(‘phantom’); setConnected(true)
setBalances({ SOL: (data.result?.value || 0) / 1e9 })
} catch(e) { setError(’Phantom failed: ’ + e.message) }
setLoading(false)
}, [])

const connectWalletConnect = useCallback(async () => {
setLoading(true); setError(null)
try {
const { EthereumProvider } = await import(‘https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.17.0/dist/index.umd.js’)
const provider = await EthereumProvider.init({
projectId: import.meta.env.VITE_WC_PROJECT_ID || ‘3c44072eb42de8a5ed5d7a33a8b6336d’,
chains: [1], showQrModal: true,
})
await provider.connect()
setAddress(provider.accounts[0]); setWalletType(‘walletconnect’); setConnected(true)
window.ethereum = provider
await fetchEVMBalances(provider.accounts[0])
} catch(e) { setError(’WalletConnect failed: ’ + e.message) }
setLoading(false)
}, [fetchEVMBalances])

const disconnect = useCallback(() => {
setConnected(false); setWalletType(null); setAddress(null); setBalances({}); setError(null)
if (window.solana?.isPhantom) window.solana.disconnect()
}, [])

const connect = useCallback((type) => {
const map = { metamask:connectMetaMask, walletconnect:connectWalletConnect, near:connectNEAR, phantom:connectPhantom }
map[type]?.()
}, [connectMetaMask, connectWalletConnect, connectNEAR, connectPhantom])

useEffect(() => {
if (window.ethereum) {
window.ethereum.request({ method:‘eth_accounts’ }).then(accs => {
if (accs.length) { setAddress(accs[0]); setWalletType(‘metamask’); setConnected(true); fetchEVMBalances(accs[0]) }
})
}
}, [])

return { connected, walletType, address, balances, loading, error, connect, disconnect }
}

/* ═══════════════════════════════════════
COMPONENTS
═══════════════════════════════════════ */
function Sparkline({ positive, width=70, height=24 }) {
const base = positive ? [18,22,17,25,20,28,22,30,26,35,29,40] : [40,36,40,32,36,28,33,25,30,22,26,20]
const max = Math.max(…base), min = Math.min(…base)
const pts = base.map((v,i) => { const x=(i/(base.length-1))*width; const y=height-((v-min)/(max-min))*(height-4)-2; return `${x},${y}` })
const path = pts.map((p,i)=>`${i===0?'M':'L'}${p}`).join(’ ’)
const color = positive ? ‘#10B981’ : ‘#EF4444’
return (
<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill=“none” style={{ flexShrink:0 }}>
<path d={path+` L${width},${height} L0,${height} Z`} fill={`${color}18`} />
<path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
)
}

function PulseRing({ color=’#10B981’, size=8 }) {
return (
<span style={{ position:‘relative’, display:‘inline-flex’, width:size, height:size, flexShrink:0 }}>
<span style={{ position:‘absolute’, inset:0, borderRadius:‘50%’, background:color, animation:‘ping 1.5s cubic-bezier(0,0,.2,1) infinite’, opacity:.5 }} />
<span style={{ position:‘relative’, width:size, height:size, borderRadius:‘50%’, background:color }} />
</span>
)
}

function Badge({ children, color=’#10B981’ }) {
return <span style={{ fontSize:10, padding:‘2px 7px’, borderRadius:5, fontWeight:500, background:`${color}18`, color, display:‘inline-block’, whiteSpace:‘nowrap’ }}>{children}</span>
}

function Toggle({ value, onChange }) {
return (
<button onClick={()=>onChange(!value)} style={{ width:38, height:21, borderRadius:11, background:value?’#7C6AF7’:’#2D2D45’, border:‘none’, cursor:‘pointer’, position:‘relative’, transition:‘background .2s’, flexShrink:0 }}>
<div style={{ position:‘absolute’, top:2.5, left:value?19:2.5, width:16, height:16, borderRadius:8, background:’#fff’, transition:‘left .2s’ }} />
</button>
)
}

function Btn({ children, onClick, variant=‘primary’, style={}, href, target, disabled }) {
const base = { border:‘none’, cursor:disabled?‘not-allowed’:‘pointer’, borderRadius:10, fontFamily:”‘DM Mono’,monospace”, fontSize:13, fontWeight:500, padding:‘9px 16px’, transition:‘all .15s’, display:‘inline-flex’, alignItems:‘center’, justifyContent:‘center’, gap:6, textDecoration:‘none’, opacity:disabled?.5:1, WebkitTapHighlightColor:‘transparent’ }
const v = { primary:{background:’#7C6AF7’,color:’#fff’}, ghost:{background:’#13131A’,color:’#888899’,border:‘1px solid #1E1E2E’}, danger:{background:’#EF444415’,color:’#EF4444’,border:‘1px solid #EF444425’}, green:{background:’#10B98115’,color:’#10B981’,border:‘1px solid #10B98125’} }
const Tag = href ? ‘a’ : ‘button’
return <Tag href={href} target={target} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</Tag>
}

/* ── Wallet Modal ─────────────────────── */
function WalletModal({ onConnect, onClose, loading, error }) {
return (
<div style={{ position:‘fixed’, inset:0, background:‘rgba(0,0,0,.85)’, backdropFilter:‘blur(10px)’, zIndex:200, display:‘flex’, alignItems:‘flex-end’, justifyContent:‘center’, padding:0 }}
onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
<div style={{ background:’#13131A’, border:‘1px solid #2D2D45’, borderRadius:‘20px 20px 0 0’, padding:‘20px 16px 32px’, width:‘100%’, maxWidth:480, animation:‘slideUp .3s ease’ }}>
{/* Handle bar */}
<div style={{ width:40, height:4, background:’#2D2D45’, borderRadius:2, margin:‘0 auto 20px’ }} />

```
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18 }}>Connect Wallet</div>
      <div style={{ fontSize:12, color:'#666680', marginTop:4 }}>Choose your wallet</div>
    </div>

    {error && (
      <div style={{ background:'#EF444415', border:'1px solid #EF444430', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#EF4444', marginBottom:14 }}>
        ⚠️ {error}
      </div>
    )}

    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {WALLETS_LIST.map(w => (
        <button key={w.id} onClick={()=>onConnect(w.id)} disabled={loading}
          style={{ background:'#0D0D14', border:`1px solid #1E1E2E`, borderRadius:14, padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all .15s', textAlign:'left', WebkitTapHighlightColor:'transparent' }}
          onTouchStart={e=>e.currentTarget.style.background='#111118'}
          onTouchEnd={e=>e.currentTarget.style.background='#0D0D14'}
        >
          <div style={{ width:44, height:44, borderRadius:12, background:`${w.color}18`, border:`1px solid ${w.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{w.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15, color:'#E8E8F0' }}>{w.name}</div>
            <div style={{ fontSize:11, color:'#666680', marginTop:2 }}>{w.desc}</div>
          </div>
          {loading ? <div style={{ width:18, height:18, border:'2px solid #7C6AF7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', flexShrink:0 }}/> : <span style={{ color:'#444460', fontSize:14 }}>›</span>}
        </button>
      ))}
    </div>
  </div>
</div>
```

)
}

/* ── Bottom Nav ───────────────────────── */
function BottomNav({ view, setView }) {
return (
<nav style={{ position:‘fixed’, bottom:0, left:0, right:0, background:‘rgba(10,10,15,.96)’, backdropFilter:‘blur(20px)’, borderTop:‘1px solid #1E1E2E’, display:‘flex’, zIndex:50, paddingBottom:‘env(safe-area-inset-bottom)’ }}>
{NAV.map(n => (
<button key={n.key} onClick={()=>setView(n.key)}
style={{ flex:1, background:‘none’, border:‘none’, cursor:‘pointer’, padding:‘10px 4px 8px’, display:‘flex’, flexDirection:‘column’, alignItems:‘center’, gap:3, WebkitTapHighlightColor:‘transparent’, transition:‘all .15s’ }}>
<span style={{ fontSize:20, lineHeight:1 }}>{n.emoji}</span>
<span style={{ fontSize:10, fontFamily:”‘DM Mono’,monospace”, color:view===n.key?’#7C6AF7’:’#555570’, fontWeight:view===n.key?500:400, transition:‘color .15s’ }}>{n.label}</span>
{view===n.key && <div style={{ width:4, height:4, borderRadius:2, background:’#7C6AF7’ }} />}
</button>
))}
</nav>
)
}

/* ── Top Bar ──────────────────────────── */
function TopBar({ wallet, onOpenWallet }) {
const walletInfo = WALLETS_LIST.find(w=>w.id===wallet.walletType)
const short = wallet.address ? (wallet.walletType===‘near’ ? wallet.address : `${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}`) : null

return (
<nav style={{ position:‘sticky’, top:0, zIndex:50, background:‘rgba(10,10,15,.95)’, backdropFilter:‘blur(20px)’, borderBottom:‘1px solid #1E1E2E’, padding:‘0 16px’, height:52, display:‘flex’, alignItems:‘center’, justifyContent:‘space-between’ }}>
{/* Logo */}
<a href={SITE.whaletrucker} target=”_blank” rel=“noreferrer” style={{ display:‘flex’, alignItems:‘center’, gap:8, textDecoration:‘none’, color:‘inherit’ }}>
<div style={{ width:28, height:28, borderRadius:8, background:‘linear-gradient(135deg,#7C6AF7,#4F46E5)’, display:‘flex’, alignItems:‘center’, justifyContent:‘center’, fontSize:14 }}>🐋</div>
<div>
<div style={{ fontFamily:”‘Space Grotesk’,sans-serif”, fontWeight:700, fontSize:14, lineHeight:1 }}>WhaleTrucker</div>
<div style={{ fontSize:9, color:’#555570’, lineHeight:1, marginTop:1 }}>AssetFlow</div>
</div>
</a>

```
  {/* Right */}
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#10B981' }}>
      <PulseRing color="#10B981" size={6} /> <span style={{ fontFamily:"'DM Mono',monospace" }}>LIVE</span>
    </div>

    {wallet.connected ? (
      <button onClick={onOpenWallet}
        style={{ background:'#13131A', border:'1px solid #2D2D45', borderRadius:20, padding:'5px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:6, WebkitTapHighlightColor:'transparent' }}>
        <span style={{ fontSize:13 }}>{walletInfo?.icon}</span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#A0A0C0' }}>{short}</span>
      </button>
    ) : (
      <button onClick={onOpenWallet}
        style={{ background:'linear-gradient(135deg,#7C6AF7,#4F46E5)', border:'none', color:'#fff', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500, WebkitTapHighlightColor:'transparent' }}>
        🔗 Connect
      </button>
    )}
  </div>
</nav>
```

)
}

/* ═══════════════════════════════════════
VIEWS
═══════════════════════════════════════ */
function Dashboard({ rules, wallet }) {
const assets = MOCK_ASSETS.map(a => {
const real = wallet.balances[a.symbol]
if (real !== undefined) return { …a, amount:real, value:real*(a.value/a.amount) }
return a
})
const total = assets.reduce((s,a)=>s+a.value,0)
const totalChange = assets.reduce((s,a)=>s+(a.value*a.change/100),0)

return (
<div style={{ display:‘flex’, flexDirection:‘column’, gap:12 }}>

```
  {/* Connected Banner */}
  {wallet.connected && (
    <div style={{ background:'#0D1A12', border:'1px solid #1A3A24', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeUp .3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <PulseRing color="#10B981" size={7} />
        <span style={{ fontSize:12, color:'#10B981', fontWeight:500 }}>{WALLETS_LIST.find(w=>w.id===wallet.walletType)?.name} Connected</span>
      </div>
      <button onClick={wallet.disconnect} style={{ background:'none', border:'none', fontSize:11, color:'#EF4444', cursor:'pointer', fontFamily:"'DM Mono',monospace" }}>Disconnect</button>
    </div>
  )}

  {/* Hero Card */}
  <div style={{ background:'linear-gradient(135deg,#13131A,#1A1228,#13131A)', border:'1px solid #2D2D50', borderRadius:20, padding:'20px 18px', position:'relative', overflow:'hidden', animation:'fadeUp .3s ease' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#7C6AF7,transparent)' }}/>
    <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:20, pointerEvents:'none' }}>
      <div style={{ position:'absolute', width:'100%', height:2, background:'linear-gradient(90deg,transparent,rgba(124,106,247,.1),transparent)', animation:'scanline 6s linear infinite' }}/>
    </div>
    <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>
      {wallet.connected ? '● Live Portfolio' : 'Total Portfolio'}
    </div>
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:32, fontWeight:700, letterSpacing:'-.02em', lineHeight:1 }}>
      ${total.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
    </div>
    <div style={{ marginTop:6, fontSize:12, color:'#10B981', display:'flex', alignItems:'center', gap:4 }}>
      ▲ +${Math.abs(totalChange).toFixed(2)} today
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:16 }}>
      {[{label:'Assets',val:assets.length},{label:'Active Rules',val:`${rules.filter(r=>r.active).length}/${rules.length}`},{label:'Month',val:'+12.3%',color:'#10B981'}].map(s=>(
        <div key={s.label} style={{ background:'rgba(255,255,255,.06)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:3, letterSpacing:'.05em' }}>{s.label.toUpperCase()}</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16, color:s.color||'#E8E8F0' }}>{s.val}</div>
        </div>
      ))}
    </div>
  </div>

  {/* Assets - single column on mobile */}
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {assets.map((a,i)=>(
      <div key={a.id} style={{ background:'#13131A', border:`1px solid ${a.color}35`, borderRadius:14, padding:'14px 16px', animation:'fadeUp .3s ease', animationDelay:`${i*.06}s`, animationFillMode:'both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${a.color}18`, border:`1px solid ${a.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:a.color, fontWeight:700, flexShrink:0 }}>{a.icon}</div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15 }}>{a.name}</span>
                {wallet.connected && wallet.balances[a.symbol]!==undefined && <Badge color="#10B981">LIVE</Badge>}
              </div>
              <div style={{ fontSize:11, color:'#555570' }}>{a.amount.toLocaleString(undefined,{maximumFractionDigits:6})} {a.symbol}</div>
            </div>
          </div>
          <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16 }}>${a.value.toLocaleString('en',{maximumFractionDigits:0})}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Badge color={a.change>0?'#10B981':'#EF4444'}>{a.change>0?'▲':'▼'} {Math.abs(a.change)}%</Badge>
              <Sparkline positive={a.change>0} width={60} height={22} />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* USUAL Banner */}
  <div style={{ background:'linear-gradient(135deg,#1A0E2E,#130D1F)', border:'1px solid #4C1D95', borderRadius:16, padding:'16px 16px', animation:'fadeUp .4s ease .2s both' }}>
    <div style={{ fontSize:10, color:'#8B5CF6', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>🐋 USUAL Unlock Monitor</div>
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, marginBottom:4 }}>
      {wallet.connected && wallet.balances['USUAL'] ? wallet.balances['USUAL'].toLocaleString() : '1,510,000'} <span style={{ color:'#8B5CF6' }}>USUAL</span>
    </div>
    <div style={{ fontSize:11, color:'#666680', marginBottom:14 }}>≈ $39,870.55 · @scutua · $0.0264</div>
    <div style={{ display:'flex', gap:8 }}>
      <Btn href={SITE.czonedive} target="_blank" variant="ghost" style={{ flex:1, fontSize:12 }}>Tracker →</Btn>
      <Btn href="https://app.usual.money" target="_blank" variant="primary" style={{ flex:1, fontSize:12 }}>Claim 🎁</Btn>
    </div>
  </div>

  {/* Dune Banner */}
  <div style={{ background:'#0D0D14', border:'1px solid #1E1E2E', borderRadius:14, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, animation:'fadeUp .4s ease .3s both' }}>
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:'#FF6B2B18', border:'1px solid #FF6B2B30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📊</div>
      <div>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:13 }}>Dune Analytics</div>
        <div style={{ fontSize:10, color:'#666680', marginTop:2 }}>ERC20 Monitor · UNI · 7d</div>
      </div>
    </div>
    <Btn href={SITE.dune} target="_blank" variant="ghost" style={{ fontSize:11, padding:'6px 12px', whiteSpace:'nowrap' }}>View →</Btn>
  </div>
</div>
```

)
}

function AutoRules({ rules, setRules }) {
const [form, setForm] = useState({ asset:’’, freq:’’, amount:’’ })
const [added, setAdded] = useState(false)
const [showForm, setShowForm] = useState(false)
const toggle = (id) => setRules(r=>r.map(x=>x.id===id?{…x,active:!x.active}:x))
const create = () => {
if (!form.asset||!form.freq||!form.amount) return
setRules(r=>[…r,{ id:Date.now(), name:`${form.asset} ${form.freq} Auto`, asset:form.asset, color:’#7C6AF7’, freq:form.freq, amount:form.amount, next:‘Tomorrow’, active:true, totalRuns:0, totalValue:’$0’ }])
setForm({ asset:’’, freq:’’, amount:’’ }); setAdded(true); setShowForm(false)
setTimeout(()=>setAdded(false),2000)
}

const selStyle = { background:’#0D0D14’, border:‘1px solid #1E1E2E’, color:’#E8E8F0’, borderRadius:10, padding:‘11px 14px’, fontFamily:”‘DM Mono’,monospace”, fontSize:13, outline:‘none’, width:‘100%’ }

return (
<div style={{ display:‘flex’, flexDirection:‘column’, gap:12 }}>
<div style={{ display:‘flex’, justifyContent:‘space-between’, alignItems:‘center’ }}>
<h2 style={{ fontFamily:”‘Space Grotesk’,sans-serif”, fontSize:20, fontWeight:700 }}>⚡ Auto Rules</h2>
<Btn variant={added?‘green’:‘primary’} onClick={()=>setShowForm(!showForm)} style={{ fontSize:12, padding:‘7px 14px’ }}>
{added ? ‘✓ Created!’ : showForm ? ‘✕ Cancel’ : ‘+ New’}
</Btn>
</div>

```
  {/* Quick Create Form */}
  {showForm && (
    <div style={{ background:'#0D1A12', border:'1px solid #1A3A24', borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:10, animation:'fadeUp .2s ease' }}>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14, marginBottom:2 }}>✦ New Rule</div>
      <select value={form.asset} onChange={e=>setForm(f=>({...f,asset:e.target.value}))} style={selStyle}>
        <option value="">Select Asset</option><option>BTC</option><option>ETH</option><option>USUAL</option><option>USDC</option><option>NEAR</option><option>SOL</option>
      </select>
      <select value={form.freq} onChange={e=>setForm(f=>({...f,freq:e.target.value}))} style={selStyle}>
        <option value="">Select Frequency</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>On Unlock</option>
      </select>
      <input placeholder="Amount (e.g. $100)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
        style={{ ...selStyle, color:form.amount?'#E8E8F0':'#555570' }} />
      <Btn variant="primary" onClick={create} style={{ width:'100%', padding:'12px' }}>Create Rule →</Btn>
    </div>
  )}

  {/* Rules list */}
  {rules.map((r,i)=>(
    <div key={r.id} style={{ background:'#13131A', border:`1px solid ${r.active?r.color+'40':'#1E1E2E'}`, borderRadius:14, padding:'14px 16px', opacity:r.active?1:.6, transition:'all .2s', animation:'fadeUp .3s ease', animationDelay:`${i*.07}s`, animationFillMode:'both' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`${r.color}18`, border:`1px solid ${r.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:r.color, fontSize:12, flexShrink:0 }}>{r.asset}</div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14 }}>{r.name}</div>
            <div style={{ fontSize:11, color:'#555570', marginTop:2 }}>{r.freq} · {r.amount}</div>
          </div>
        </div>
        <Toggle value={r.active} onChange={()=>toggle(r.id)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
        {[{label:'Next Run',val:r.next},{label:'Total Runs',val:r.totalRuns},{label:'Total In',val:r.totalValue}].map(s=>(
          <div key={s.label} style={{ background:'#0D0D14', borderRadius:8, padding:'8px 10px' }}>
            <div style={{ fontSize:9, color:'#444460', marginBottom:2, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
            <div style={{ fontSize:12, fontWeight:500 }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <Btn variant="ghost" style={{ flex:1, fontSize:11, padding:'7px' }} onClick={()=>toggle(r.id)}>{r.active?'⏸ Pause':'▶ Resume'}</Btn>
        <Btn variant="danger" style={{ fontSize:11, padding:'7px 12px' }} onClick={()=>setRules(rx=>rx.filter(x=>x.id!==r.id))}>✕</Btn>
      </div>
    </div>
  ))}
</div>
```

)
}

function ReceiveAssets({ wallet }) {
const [copied, setCopied] = useState(’’)
const copy = (text, key) => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(key); setTimeout(()=>setCopied(’’),2000) }

const wallets = [
{ name:‘Bitcoin’,       symbol:‘BTC’,  address:‘3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5’, network:‘BTC’,  color:’#F7931A’, icon:‘₿’, live:false },
{ name:‘Ethereum’,      symbol:‘ETH’,  address:wallet.connected&&wallet.walletType!==‘near’&&wallet.walletType!==‘phantom’?wallet.address:‘0x742d35Cc6634C0532925a3b8D5C7C2955b4a18e5’, network:‘ETH’,  color:’#627EEA’, icon:‘Ξ’, live:wallet.connected&&wallet.walletType===‘metamask’||wallet.walletType===‘walletconnect’ },
{ name:‘NEAR Protocol’, symbol:‘NEAR’, address:wallet.connected&&wallet.walletType===‘near’?wallet.address:‘scutua.near’, network:‘NEAR’, color:’#00C08B’, icon:‘N’, live:wallet.connected&&wallet.walletType===‘near’ },
{ name:‘Solana’,        symbol:‘SOL’,  address:wallet.connected&&wallet.walletType===‘phantom’?wallet.address:‘Connect Phantom’, network:‘SOL’,  color:’#AB9FF2’, icon:‘◎’, live:wallet.connected&&wallet.walletType===‘phantom’ },
]

return (
<div style={{ display:‘flex’, flexDirection:‘column’, gap:12 }}>
<h2 style={{ fontFamily:”‘Space Grotesk’,sans-serif”, fontSize:20, fontWeight:700 }}>📥 Receive Assets</h2>
<div style={{ fontSize:11, color:’#888899’, padding:‘10px 14px’, background:’#0D1A12’, border:‘1px solid #1A3A24’, borderRadius:10 }}>
⚠️ Verify network before sending. Wrong network = lost funds.
</div>
{wallets.map((w,i)=>(
<div key={w.name} style={{ background:’#13131A’, border:`1px solid ${w.color}35`, borderRadius:14, padding:‘14px 16px’, animation:‘fadeUp .3s ease’, animationDelay:`${i*.07}s`, animationFillMode:‘both’ }}>
<div style={{ display:‘flex’, justifyContent:‘space-between’, alignItems:‘center’, marginBottom:12 }}>
<div style={{ display:‘flex’, alignItems:‘center’, gap:10 }}>
<div style={{ width:38, height:38, borderRadius:10, background:`${w.color}18`, border:`1px solid ${w.color}30`, display:‘flex’, alignItems:‘center’, justifyContent:‘center’, fontWeight:700, color:w.color, fontSize:16, flexShrink:0 }}>{w.icon}</div>
<div>
<div style={{ display:‘flex’, alignItems:‘center’, gap:6 }}>
<span style={{ fontFamily:”‘Space Grotesk’,sans-serif”, fontWeight:600, fontSize:14 }}>{w.name}</span>
{w.live && <Badge color="#10B981">● LIVE</Badge>}
</div>
<div style={{ fontSize:10, color:’#555570’, marginTop:2 }}>Deposit address</div>
</div>
</div>
<Badge color={w.color}>{w.network}</Badge>
</div>
<div style={{ background:’#0D0D14’, borderRadius:10, padding:‘10px 12px’, marginBottom:10 }}>
<code style={{ fontSize:11, color:’#888899’, wordBreak:‘break-all’, lineHeight:1.6 }}>{w.address}</code>
</div>
<Btn variant={copied===w.name?‘green’:‘ghost’} onClick={()=>copy(w.address,w.name)} style={{ width:‘100%’, padding:‘10px’ }}>
{copied===w.name ? ‘✓ Copied!’ : ‘📋 Copy Address’}
</Btn>
</div>
))}
</div>
)
}

function Yields() {
const data = [
{ name:‘Curve Finance’,    apy:8.2,  tvl:’$4.2B’, risk:‘Low’,    asset:‘USDC/USDT’, color:’#10B981’, icon:’〜’, chain:‘ETH’ },
{ name:‘Aave V3’,          apy:5.4,  tvl:’$8.1B’, risk:‘Low’,    asset:‘USDC’,      color:’#7C6AF7’, icon:‘Ξ’,  chain:‘ETH’ },
{ name:‘Compound V3’,      apy:4.8,  tvl:’$2.3B’, risk:‘Low’,    asset:‘USDC’,      color:’#00D395’, icon:‘C’,  chain:‘ETH’ },
{ name:‘Convex Finance’,   apy:12.1, tvl:’$1.8B’, risk:‘Medium’, asset:‘CRV/CVX’,   color:’#F3BA2F’, icon:‘X’,  chain:‘ETH’ },
{ name:‘NEAR Ref Finance’, apy:9.3,  tvl:’$180M’, risk:‘Medium’, asset:‘NEAR/USDC’, color:’#00C08B’, icon:‘N’,  chain:‘NEAR’ },
]
const avg = (data.reduce((s,y)=>s+y.apy,0)/data.length).toFixed(1)

return (
<div style={{ display:‘flex’, flexDirection:‘column’, gap:12 }}>
<div style={{ display:‘flex’, justifyContent:‘space-between’, alignItems:‘center’ }}>
<h2 style={{ fontFamily:”‘Space Grotesk’,sans-serif”, fontSize:20, fontWeight:700 }}>🚚 Yields</h2>
<Btn href={SITE.whaletrucker} target=”_blank” variant=“ghost” style={{ fontSize:11, padding:‘6px 12px’ }}>Full Site →</Btn>
</div>

```
  {/* Stats */}
  <div style={{ background:'linear-gradient(135deg,#0D1A12,#0A130D)', border:'1px solid #1A3A24', borderRadius:14, padding:'16px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
    {[
      { label:'Avg APY',      value:`${avg}%`,  color:'#10B981', icon:'📈' },
      { label:'Monthly',      value:`~$${((6000*(avg/100))/12).toFixed(0)}`, color:'#10B981', icon:'💰' },
      { label:'Annual Yield', value:`~$${(6000*(avg/100)).toFixed(0)}`, color:'#F3BA2F', icon:'🎯' },
    ].map(s=>(
      <div key={s.label} style={{ textAlign:'center' }}>
        <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
        <div style={{ fontSize:9, color:'#555570', marginBottom:2, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16, color:s.color }}>{s.value}</div>
      </div>
    ))}
  </div>

  {/* Protocols */}
  {data.map((p,i)=>(
    <div key={p.name} style={{ background:'#13131A', border:`1px solid ${p.color}30`, borderRadius:14, padding:'14px 16px', animation:'fadeUp .3s ease', animationDelay:`${i*.06}s`, animationFillMode:'both' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`${p.color}18`, border:`1px solid ${p.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:p.color, fontSize:16, flexShrink:0 }}>{p.icon}</div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14 }}>{p.name}</div>
            <div style={{ fontSize:11, color:'#555570', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
              <span>{p.asset}</span>
              <Badge color={p.risk==='Low'?'#10B981':'#F3BA2F'}>{p.risk}</Badge>
              <span style={{ background:`${p.color}18`, color:p.color, padding:'1px 6px', borderRadius:4, fontSize:9 }}>{p.chain}</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22, color:p.color }}>{p.apy}%</div>
          <div style={{ fontSize:10, color:'#555570' }}>APY</div>
        </div>
      </div>
    </div>
  ))}
</div>
```

)
}

/* ═══════════════════════════════════════
APP
═══════════════════════════════════════ */
export default function App() {
const [view, setView]     = useState(‘dashboard’)
const [rules, setRules]   = useState(INIT_RULES)
const [showModal, setShowModal] = useState(false)
const [notif, setNotif]   = useState(null)
const wallet = useWallet()

useEffect(()=>{
const t = setTimeout(()=>{ setNotif(‘🐋 0.001 ETH received · just now’); setTimeout(()=>setNotif(null),4000) },5000)
return ()=>clearTimeout(t)
},[])

useEffect(()=>{
if (wallet.connected) {
setNotif(`✅ ${WALLETS_LIST.find(w=>w.id===wallet.walletType)?.name} connected!`)
setTimeout(()=>setNotif(null),3000)
setShowModal(false)
}
},[wallet.connected])

return (
<div style={{ minHeight:‘100vh’, background:’#0A0A0F’, color:’#E8E8F0’, fontFamily:”‘DM Mono’,‘Fira Code’,monospace” }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes ping{75%,100%{transform:scale(2);opacity:0}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(500%)}} @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}} @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} ::-webkit-scrollbar{width:0} select option{background:#0D0D14} input::placeholder{color:#444460}`}</style>

```
  {/* Wallet Modal */}
  {showModal && <WalletModal onConnect={wallet.connect} onClose={()=>setShowModal(false)} loading={wallet.loading} error={wallet.error} />}

  {/* Toast */}
  {notif && (
    <div style={{ position:'fixed', top:60, right:12, left:12, zIndex:999, background:'#0D1A12', border:'1px solid #1A3A24', borderRadius:12, padding:'11px 14px', fontSize:12, color:'#10B981', animation:'slideIn .3s ease', boxShadow:'0 4px 20px rgba(0,0,0,.6)', textAlign:'center' }}>
      {notif}
    </div>
  )}

  {/* Top Bar */}
  <TopBar wallet={wallet} onOpenWallet={()=>setShowModal(true)} />

  {/* Main Content - padding bottom for bottom nav */}
  <main style={{ padding:'16px 16px 90px', maxWidth:600, margin:'0 auto' }}>
    {view==='dashboard' && <Dashboard rules={rules} wallet={wallet} />}
    {view==='rules'     && <AutoRules rules={rules} setRules={setRules} />}
    {view==='receive'   && <ReceiveAssets wallet={wallet} />}
    {view==='yields'    && <Yields />}
  </main>

  {/* Bottom Navigation */}
  <BottomNav view={view} setView={setView} />
</div>
```

)
}
