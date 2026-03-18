import { useState, useEffect, useCallback, useRef } from "react"

const SITE = {
  github: 'https://github.com/scutuatua-crypto',
  whaletrucker: 'https://scutuatua-crypto.github.io/whaletrucker-reef/',
  czonedive: 'https://scutuatua-crypto.github.io/czonedive-core/',
  yields: 'http://scutuatua-crypto.github.io/whaletrucker-reef/yields.html',
  dune: 'https://dune.com/scutua',
  telegram: 'https://t.me/scutua01',
}

const COIN_IDS = { BTC:'bitcoin', ETH:'ethereum', USUAL:'usual', USDC:'usd-coin', NEAR:'near', SOL:'solana' }

const COIN_META = {
  BTC:   { name:'Bitcoin',     icon:'₿', color:'#F7931A', amount:0.05234  },
  ETH:   { name:'Ethereum',    icon:'Ξ', color:'#627EEA', amount:1.2456   },
  USUAL: { name:'USUAL Token', icon:'U', color:'#8B5CF6', amount:1510000  },
  USDC:  { name:'USD Coin',    icon:'$', color:'#2775CA', amount:5000     },
  NEAR:  { name:'NEAR',        icon:'N', color:'#00C08B', amount:100      },
  SOL:   { name:'Solana',      icon:'◎', color:'#AB9FF2', amount:2.5      },
}

const WALLETS_LIST = [
  { id:'metamask',      name:'MetaMask',      icon:'🦊', desc:'Browser extension',   color:'#F6851B' },
  { id:'walletconnect', name:'WalletConnect', icon:'🔗', desc:'Scan with any wallet', color:'#3B99FC' },
  { id:'near',          name:'NEAR Wallet',   icon:'🌊', desc:'scutua.near',          color:'#00C08B' },
  { id:'phantom',       name:'Phantom',       icon:'👻', desc:'Solana wallet',        color:'#AB9FF2' },
]

const INIT_RULES = [
  { id:1, name:'BTC Weekly DCA',        asset:'BTC',   color:'#F7931A', freq:'Weekly',    amount:'$100',  next:'Tomorrow',   active:true, totalRuns:14, totalValue:'$1,400' },
  { id:2, name:'ETH Monthly Stack',     asset:'ETH',   color:'#627EEA', freq:'Monthly',   amount:'$500',  next:'Mar 24',     active:true, totalRuns:3,  totalValue:'$1,500' },
  { id:3, name:'USUAL Harvest Monitor', asset:'USUAL', color:'#8B5CF6', freq:'On Unlock', amount:'1.51M', next:'Monitoring', active:true, totalRuns:1,  totalValue:'$39,870' },
]

const NAV = [
  { key:'dashboard', label:'Dashboard', emoji:'📊' },
  { key:'rules',     label:'Rules',     emoji:'⚡' },
  { key:'receive',   label:'Receive',   emoji:'📥' },
  { key:'yields',    label:'Yields',    emoji:'🚚' },
]

/* ── CoinGecko Prices ─────────────────── */
function usePrices() {
  const [prices, setPrices]     = useState({})
  const [changes, setChanges]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchPrices = useCallback(async () => {
    try {
      const ids = Object.values(COIN_IDS).join(',')
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      const data = await res.json()
      const p = {}, c = {}
      Object.entries(COIN_IDS).forEach(([sym, id]) => {
        if (data[id]) { p[sym] = data[id].usd; c[sym] = data[id].usd_24h_change || 0 }
      })
      setPrices(p); setChanges(c); setLastUpdate(new Date()); setLoading(false)
    } catch(e) { console.error('Price fetch failed:', e); setLoading(false) }
  }, [])

  useEffect(() => {
    fetchPrices()
    const t = setInterval(fetchPrices, 60000)
    return () => clearInterval(t)
  }, [fetchPrices])

  return { prices, changes, loading, lastUpdate, refresh: fetchPrices }
}

/* ── Wallet ───────────────────────────── */
function useWallet() {
  const [connected, setConnected]   = useState(false)
  const [walletType, setWalletType] = useState(null)
  const [address, setAddress]       = useState(null)
  const [balances, setBalances]     = useState({})
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const fetchEVMBalances = useCallback(async (addr) => {
    try {
      const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.min.js')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const ethBal = await provider.getBalance(addr)
      const bals = { ETH: parseFloat(ethers.formatEther(ethBal)) }
      const TOKENS = {
        USDC:  { address:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals:6  },
        USUAL: { address:'0xC4441c2BE5d8fA8126822B9929CA0b81Ea0DE38E', decimals:18 },
      }
      for (const [sym, tok] of Object.entries(TOKENS)) {
        try {
          const c = new ethers.Contract(tok.address, ['function balanceOf(address) view returns (uint256)'], provider)
          const b = await c.balanceOf(addr)
          bals[sym] = parseFloat(ethers.formatUnits(b, tok.decimals))
        } catch { bals[sym] = 0 }
      }
      setBalances(bals)
    } catch(e) { console.error(e) }
  }, [])

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) { setError('MetaMask not installed!'); return }
    setLoading(true); setError(null)
    try {
      const accs = await window.ethereum.request({ method:'eth_requestAccounts' })
      setAddress(accs[0]); setWalletType('metamask'); setConnected(true)
      await fetchEVMBalances(accs[0])
    } catch(e) { setError(e.message) }
    setLoading(false)
  }, [fetchEVMBalances])

  const connectNEAR = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('https://rpc.mainnet.near.org', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jsonrpc:'2.0', id:'1', method:'query', params:{ request_type:'view_account', finality:'final', account_id:'scutua.near' } })
      })
      const data = await res.json()
      if (data.result) { setAddress('scutua.near'); setWalletType('near'); setConnected(true); setBalances({ NEAR: parseFloat(data.result.amount)/1e24 }) }
      else setError('NEAR account not found')
    } catch(e) { setError('NEAR failed') }
    setLoading(false)
  }, [])

  const connectPhantom = useCallback(async () => {
    const ph = window.solana || window.phantom?.solana
    if (!ph?.isPhantom) { setError('Phantom not installed!'); return }
    setLoading(true); setError(null)
    try {
      const resp = await ph.connect()
      const addr = resp.publicKey.toString()
      const res = await fetch('https://api.mainnet-beta.solana.com', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getBalance', params:[addr] }) })
      const data = await res.json()
      setAddress(addr); setWalletType('phantom'); setConnected(true); setBalances({ SOL: (data.result?.value||0)/1e9 })
    } catch(e) { setError('Phantom failed') }
    setLoading(false)
  }, [])

  const connectWC = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { EthereumProvider } = await import('https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.17.0/dist/index.umd.js')
      const provider = await EthereumProvider.init({ projectId: import.meta.env.VITE_WC_PROJECT_ID || '3c44072eb42de8a5ed5d7a33a8b6336d', chains:[1], showQrModal:true })
      await provider.connect()
      setAddress(provider.accounts[0]); setWalletType('walletconnect'); setConnected(true)
      window.ethereum = provider; await fetchEVMBalances(provider.accounts[0])
    } catch(e) { setError('WalletConnect failed') }
    setLoading(false)
  }, [fetchEVMBalances])

  const disconnect = useCallback(() => {
    setConnected(false); setWalletType(null); setAddress(null); setBalances({}); setError(null)
    if (window.solana?.isPhantom) window.solana.disconnect()
  }, [])

  const connect = useCallback((type) => ({ metamask:connectMetaMask, walletconnect:connectWC, near:connectNEAR, phantom:connectPhantom })[type]?.(), [connectMetaMask, connectWC, connectNEAR, connectPhantom])

  useEffect(() => {
    if (window.ethereum) window.ethereum.request({ method:'eth_accounts' }).then(accs => { if (accs.length) { setAddress(accs[0]); setWalletType('metamask'); setConnected(true); fetchEVMBalances(accs[0]) } })
  }, [])

  return { connected, walletType, address, balances, loading, error, connect, disconnect }
}

/* ── UI Primitives ────────────────────── */
function Sparkline({ positive, width=60, height=22 }) {
  const base = positive ? [18,22,17,25,20,28,22,30,26,35,29,40] : [40,36,40,32,36,28,33,25,30,22,26,20]
  const max=Math.max(...base), min=Math.min(...base)
  const pts = base.map((v,i)=>{ const x=(i/(base.length-1))*width; const y=height-((v-min)/(max-min))*(height-4)-2; return `${x},${y}` })
  const path = pts.map((p,i)=>`${i===0?'M':'L'}${p}`).join(' ')
  const color = positive?'#10B981':'#EF4444'
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{flexShrink:0}}><path d={path+` L${width},${height} L0,${height} Z`} fill={`${color}18`}/><path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function PulseRing({ color='#10B981', size=7 }) {
  return <span style={{position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0}}><span style={{position:'absolute',inset:0,borderRadius:'50%',background:color,animation:'ping 1.5s cubic-bezier(0,0,.2,1) infinite',opacity:.5}}/><span style={{position:'relative',width:size,height:size,borderRadius:'50%',background:color}}/></span>
}

function Badge({ children, color='#10B981' }) {
  return <span style={{fontSize:10,padding:'2px 7px',borderRadius:5,fontWeight:500,background:`${color}18`,color,display:'inline-block',whiteSpace:'nowrap'}}>{children}</span>
}

function Toggle({ value, onChange }) {
  return <button onClick={()=>onChange(!value)} style={{width:38,height:21,borderRadius:11,background:value?'#7C6AF7':'#2D2D45',border:'none',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}><div style={{position:'absolute',top:2.5,left:value?19:2.5,width:16,height:16,borderRadius:8,background:'#fff',transition:'left .2s'}}/></button>
}

function Btn({ children, onClick, variant='primary', style={}, href, target, disabled }) {
  const v = { primary:{background:'#7C6AF7',color:'#fff'}, ghost:{background:'#13131A',color:'#888899',border:'1px solid #1E1E2E'}, danger:{background:'#EF444415',color:'#EF4444',border:'1px solid #EF444425'}, green:{background:'#10B98115',color:'#10B981',border:'1px solid #10B98125'} }
  const Tag = href?'a':'button'
  return <Tag href={href} target={target} onClick={onClick} disabled={disabled} style={{border:'none',cursor:disabled?'not-allowed':'pointer',borderRadius:10,fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,padding:'9px 16px',transition:'all .15s',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,textDecoration:'none',opacity:disabled?.5:1,WebkitTapHighlightColor:'transparent',...v[variant],...style}}>{children}</Tag>
}

/* ── Price Ticker ─────────────────────── */
function PriceTicker({ prices, changes, loading, lastUpdate, onRefresh }) {
  return (
    <div style={{background:'#0D0D14',borderBottom:'1px solid #1E1E2E',padding:'7px 16px',display:'flex',alignItems:'center',gap:10,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
      {loading ? <span style={{fontSize:11,color:'#555570',whiteSpace:'nowrap'}}>⏳ Loading prices...</span>
      : Object.keys(COIN_IDS).map(sym => prices[sym] ? (
          <div key={sym} style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
            <span style={{fontSize:10,color:'#555570'}}>{sym}</span>
            <span style={{fontSize:11,fontFamily:"'Space Grotesk',sans-serif",fontWeight:600}}>${prices[sym].toLocaleString('en',{maximumFractionDigits:prices[sym]>100?0:4})}</span>
            <span style={{fontSize:10,color:(changes[sym]||0)>=0?'#10B981':'#EF4444'}}>{(changes[sym]||0)>=0?'▲':'▼'}{Math.abs(changes[sym]||0).toFixed(1)}%</span>
            <span style={{color:'#222235'}}>·</span>
          </div>
        ) : null
      )}
      <button onClick={onRefresh} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#444460',flexShrink:0,WebkitTapHighlightColor:'transparent'}}>⟳</button>
      {lastUpdate && <span style={{fontSize:9,color:'#2A2A40',flexShrink:0,whiteSpace:'nowrap'}}>{lastUpdate.toLocaleTimeString()}</span>}
    </div>
  )
}

/* ── Wallet Modal ─────────────────────── */
function WalletModal({ onConnect, onClose, loading, error }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(10px)',zIndex:200,display:'flex',alignItems:'flex-end'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'#13131A',border:'1px solid #2D2D45',borderRadius:'20px 20px 0 0',padding:'20px 16px 36px',width:'100%',maxWidth:500,margin:'0 auto',animation:'slideUp .3s ease'}}>
        <div style={{width:40,height:4,background:'#2D2D45',borderRadius:2,margin:'0 auto 20px'}}/>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:18,marginBottom:4}}>Connect Wallet</div>
        <div style={{fontSize:12,color:'#666680',marginBottom:16}}>Choose your wallet</div>
        {error&&<div style={{background:'#EF444415',border:'1px solid #EF444430',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#EF4444',marginBottom:14}}>⚠️ {error}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {WALLETS_LIST.map(w=>(
            <button key={w.id} onClick={()=>onConnect(w.id)} disabled={loading}
              style={{background:'#0D0D14',border:'1px solid #1E1E2E',borderRadius:14,padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,WebkitTapHighlightColor:'transparent'}}
              onTouchStart={e=>e.currentTarget.style.background='#111118'} onTouchEnd={e=>e.currentTarget.style.background='#0D0D14'}>
              <div style={{width:44,height:44,borderRadius:12,background:`${w.color}18`,border:`1px solid ${w.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{w.icon}</div>
              <div style={{flex:1,textAlign:'left'}}>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:15,color:'#E8E8F0'}}>{w.name}</div>
                <div style={{fontSize:11,color:'#666680',marginTop:2}}>{w.desc}</div>
              </div>
              {loading?<div style={{width:18,height:18,border:'2px solid #7C6AF7',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',flexShrink:0}}/>:<span style={{color:'#444460',fontSize:14}}>›</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── TopBar ───────────────────────────── */
function TopBar({ wallet, onOpenWallet }) {
  const wi = WALLETS_LIST.find(w=>w.id===wallet.walletType)
  const short = wallet.address ? (wallet.walletType==='near'?wallet.address:`${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}`) : null
  return (
    <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(10,10,15,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid #1E1E2E',padding:'0 16px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <a href={SITE.whaletrucker} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'inherit'}}>
        <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#7C6AF7,#4F46E5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🐋</div>
        <div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:14,lineHeight:1}}>WhaleTrucker</div>
          <div style={{fontSize:9,color:'#555570',lineHeight:1,marginTop:1}}>AssetFlow</div>
        </div>
      </a>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#10B981'}}><PulseRing color="#10B981" size={6}/><span style={{fontFamily:"'DM Mono',monospace"}}>LIVE</span></div>
        {wallet.connected
          ? <button onClick={onOpenWallet} style={{background:'#13131A',border:'1px solid #2D2D45',borderRadius:20,padding:'5px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,WebkitTapHighlightColor:'transparent'}}><span style={{fontSize:13}}>{wi?.icon}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'#A0A0C0'}}>{short}</span></button>
          : <button onClick={onOpenWallet} style={{background:'linear-gradient(135deg,#7C6AF7,#4F46E5)',border:'none',color:'#fff',borderRadius:20,padding:'6px 14px',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:12,WebkitTapHighlightColor:'transparent'}}>🔗 Connect</button>
        }
      </div>
    </nav>
  )
}

/* ── BottomNav ────────────────────────── */
function BottomNav({ view, setView }) {
  return (
    <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'rgba(10,10,15,.97)',backdropFilter:'blur(20px)',borderTop:'1px solid #1E1E2E',display:'flex',zIndex:50,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {NAV.map(n=>(
        <button key={n.key} onClick={()=>setView(n.key)} style={{flex:1,background:'none',border:'none',cursor:'pointer',padding:'10px 4px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,WebkitTapHighlightColor:'transparent'}}>
          <span style={{fontSize:20,lineHeight:1}}>{n.emoji}</span>
          <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:view===n.key?'#7C6AF7':'#555570',transition:'color .15s'}}>{n.label}</span>
          {view===n.key&&<div style={{width:4,height:4,borderRadius:2,background:'#7C6AF7'}}/>}
        </button>
      ))}
    </nav>
  )
}

/* ═══════════════════════════════════════
   VIEWS
═══════════════════════════════════════ */
function Dashboard({ rules, wallet, prices, changes, pricesLoading }) {
  const assets = Object.entries(COIN_META).map(([sym, meta]) => ({
    sym, ...meta,
    price:  prices[sym]  || 0,
    change: changes[sym] || 0,
    amount: wallet.balances[sym] !== undefined ? wallet.balances[sym] : meta.amount,
    get value() { return this.amount * this.price },
  }))
  const total       = assets.reduce((s,a)=>s+a.value, 0)
  const totalChange = assets.reduce((s,a)=>s+(a.value*a.change/100), 0)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {wallet.connected&&(
        <div style={{background:'#0D1A12',border:'1px solid #1A3A24',borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><PulseRing color="#10B981"/><span style={{fontSize:12,color:'#10B981',fontWeight:500}}>{WALLETS_LIST.find(w=>w.id===wallet.walletType)?.name} Connected</span></div>
          <button onClick={wallet.disconnect} style={{background:'none',border:'none',fontSize:11,color:'#EF4444',cursor:'pointer',fontFamily:"'DM Mono',monospace"}}>Disconnect</button>
        </div>
      )}

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#13131A,#1A1228,#13131A)',border:'1px solid #2D2D50',borderRadius:20,padding:'20px 18px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#7C6AF7,transparent)'}}/>
        <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:20,pointerEvents:'none'}}><div style={{position:'absolute',width:'100%',height:2,background:'linear-gradient(90deg,transparent,rgba(124,106,247,.1),transparent)',animation:'scanline 6s linear infinite'}}/></div>
        <div style={{fontSize:10,color:'rgba(255,255,255,.4)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>{wallet.connected?'● Live Portfolio':'● Live Prices · CoinGecko'}</div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:32,fontWeight:700,letterSpacing:'-.02em',lineHeight:1}}>{pricesLoading?'Loading...': `$${total.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`}</div>
        <div style={{marginTop:6,fontSize:12,color:totalChange>=0?'#10B981':'#EF4444'}}>{totalChange>=0?'▲':'▼'} ${Math.abs(totalChange).toFixed(2)} today</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:16}}>
          {[{label:'Assets',val:6},{label:'Rules',val:`${rules.filter(r=>r.active).length}/${rules.length}`},{label:'Month',val:'+12.3%',color:'#10B981'}].map(s=>(
            <div key={s.label} style={{background:'rgba(255,255,255,.06)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginBottom:3}}>{s.label.toUpperCase()}</div>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:s.color||'#E8E8F0'}}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assets */}
      {assets.map((a,i)=>(
        <div key={a.sym} style={{background:'#13131A',border:`1px solid ${a.color}35`,borderRadius:14,padding:'14px 16px',animation:'fadeUp .3s ease',animationDelay:`${i*.05}s`,animationFillMode:'both'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:`${a.color}18`,border:`1px solid ${a.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:a.color,fontWeight:700,flexShrink:0}}>{a.icon}</div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:15}}>{a.name}</span>
                  {wallet.connected&&wallet.balances[a.sym]!==undefined&&<Badge color="#10B981">LIVE</Badge>}
                </div>
                <div style={{fontSize:11,color:'#555570'}}>
                  {a.amount.toLocaleString(undefined,{maximumFractionDigits:4})} {a.sym}
                  {a.price>0&&<span style={{color:'#333350'}}> · ${a.price.toLocaleString('en',{maximumFractionDigits:a.price>100?2:6})}</span>}
                </div>
              </div>
            </div>
            <div style={{textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16}}>{pricesLoading?'---':`$${a.value.toLocaleString('en',{maximumFractionDigits:0})}`}</div>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <Badge color={a.change>=0?'#10B981':'#EF4444'}>{a.change>=0?'▲':'▼'} {Math.abs(a.change).toFixed(1)}%</Badge>
                <Sparkline positive={a.change>=0}/>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* USUAL Banner */}
      <div style={{background:'linear-gradient(135deg,#1A0E2E,#130D1F)',border:'1px solid #4C1D95',borderRadius:16,padding:'16px'}}>
        <div style={{fontSize:10,color:'#8B5CF6',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>🐋 USUAL Unlock Monitor</div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,marginBottom:2}}>1,510,000 <span style={{color:'#8B5CF6'}}>USUAL</span></div>
        <div style={{fontSize:11,color:'#666680',marginBottom:14}}>
          {prices['USUAL']?`≈ $${(1510000*prices['USUAL']).toLocaleString('en',{maximumFractionDigits:0})} · $${prices['USUAL'].toFixed(4)}/USUAL`:'≈ $39,870.55 · loading price...'}
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn href={SITE.czonedive} target="_blank" variant="ghost" style={{flex:1,fontSize:12}}>Tracker →</Btn>
          <Btn href="https://app.usual.money" target="_blank" variant="primary" style={{flex:1,fontSize:12}}>Claim 🎁</Btn>
        </div>
      </div>

      <div style={{background:'#0D0D14',border:'1px solid #1E1E2E',borderRadius:14,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'#FF6B2B18',border:'1px solid #FF6B2B30',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📊</div>
          <div><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:13}}>Dune Analytics</div><div style={{fontSize:10,color:'#666680',marginTop:2}}>ERC20 Monitor · UNI · 7d</div></div>
        </div>
        <Btn href={SITE.dune} target="_blank" variant="ghost" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap'}}>View →</Btn>
      </div>
    </div>
  )
}

function AutoRules({ rules, setRules }) {
  const [form, setForm] = useState({asset:'',freq:'',amount:''})
  const [added, setAdded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const toggle = id => setRules(r=>r.map(x=>x.id===id?{...x,active:!x.active}:x))
  const create = () => {
    if (!form.asset||!form.freq||!form.amount) return
    setRules(r=>[...r,{id:Date.now(),name:`${form.asset} ${form.freq} Auto`,asset:form.asset,color:'#7C6AF7',freq:form.freq,amount:form.amount,next:'Tomorrow',active:true,totalRuns:0,totalValue:'$0'}])
    setForm({asset:'',freq:'',amount:''}); setAdded(true); setShowForm(false); setTimeout(()=>setAdded(false),2000)
  }
  const sel = {background:'#0D0D14',border:'1px solid #1E1E2E',color:'#E8E8F0',borderRadius:10,padding:'11px 14px',fontFamily:"'DM Mono',monospace",fontSize:13,outline:'none',width:'100%'}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700}}>⚡ Auto Rules</h2>
        <Btn variant={added?'green':'primary'} onClick={()=>setShowForm(!showForm)} style={{fontSize:12,padding:'7px 14px'}}>{added?'✓ Done!':showForm?'✕ Cancel':'+ New'}</Btn>
      </div>
      {showForm&&(
        <div style={{background:'#0D1A12',border:'1px solid #1A3A24',borderRadius:14,padding:16,display:'flex',flexDirection:'column',gap:10,animation:'fadeUp .2s ease'}}>
          <select value={form.asset} onChange={e=>setForm(f=>({...f,asset:e.target.value}))} style={sel}><option value="">Select Asset</option><option>BTC</option><option>ETH</option><option>USUAL</option><option>USDC</option><option>NEAR</option><option>SOL</option></select>
          <select value={form.freq} onChange={e=>setForm(f=>({...f,freq:e.target.value}))} style={sel}><option value="">Select Frequency</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>On Unlock</option></select>
          <input placeholder="Amount (e.g. $100)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{...sel,color:form.amount?'#E8E8F0':'#555570'}}/>
          <Btn variant="primary" onClick={create} style={{width:'100%',padding:'12px'}}>Create Rule →</Btn>
        </div>
      )}
      {rules.map((r,i)=>(
        <div key={r.id} style={{background:'#13131A',border:`1px solid ${r.active?r.color+'40':'#1E1E2E'}`,borderRadius:14,padding:'14px 16px',opacity:r.active?1:.6,animation:'fadeUp .3s ease',animationDelay:`${i*.07}s`,animationFillMode:'both'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${r.color}18`,border:`1px solid ${r.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:r.color,fontSize:12,flexShrink:0}}>{r.asset}</div>
              <div><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:14}}>{r.name}</div><div style={{fontSize:11,color:'#555570',marginTop:2}}>{r.freq} · {r.amount}</div></div>
            </div>
            <Toggle value={r.active} onChange={()=>toggle(r.id)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
            {[{label:'Next Run',val:r.next},{label:'Runs',val:r.totalRuns},{label:'Total In',val:r.totalValue}].map(s=>(
              <div key={s.label} style={{background:'#0D0D14',borderRadius:8,padding:'8px 10px'}}><div style={{fontSize:9,color:'#444460',marginBottom:2,textTransform:'uppercase'}}>{s.label}</div><div style={{fontSize:12,fontWeight:500}}>{s.val}</div></div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn variant="ghost" style={{flex:1,fontSize:11,padding:'7px'}} onClick={()=>toggle(r.id)}>{r.active?'⏸ Pause':'▶ Resume'}</Btn>
            <Btn variant="danger" style={{fontSize:11,padding:'7px 12px'}} onClick={()=>setRules(rx=>rx.filter(x=>x.id!==r.id))}>✕</Btn>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReceiveAssets({ wallet }) {
  const [copied, setCopied] = useState('')
  const copy = (t,k) => { navigator.clipboard.writeText(t).catch(()=>{}); setCopied(k); setTimeout(()=>setCopied(''),2000) }
  const wallets = [
    {name:'Bitcoin', symbol:'BTC', address:'3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5', network:'BTC', color:'#F7931A', icon:'₿', live:false},
    {name:'Ethereum', symbol:'ETH', address:wallet.connected&&['metamask','walletconnect'].includes(wallet.walletType)?wallet.address:'0x742d35Cc6634C0532925a3b8D5C7C2955b4a18e5', network:'ETH', color:'#627EEA', icon:'Ξ', live:wallet.connected&&['metamask','walletconnect'].includes(wallet.walletType)},
    {name:'NEAR Protocol', symbol:'NEAR', address:wallet.connected&&wallet.walletType==='near'?wallet.address:'scutua.near', network:'NEAR', color:'#00C08B', icon:'N', live:wallet.connected&&wallet.walletType==='near'},
    {name:'Solana', symbol:'SOL', address:wallet.connected&&wallet.walletType==='phantom'?wallet.address:'Connect Phantom', network:'SOL', color:'#AB9FF2', icon:'◎', live:wallet.connected&&wallet.walletType==='phantom'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700}}>📥 Receive</h2>
      <div style={{fontSize:11,color:'#888899',padding:'10px 14px',background:'#0D1A12',border:'1px solid #1A3A24',borderRadius:10}}>⚠️ Verify network before sending. Wrong network = lost funds.</div>
      {wallets.map((w,i)=>(
        <div key={w.name} style={{background:'#13131A',border:`1px solid ${w.color}35`,borderRadius:14,padding:'14px 16px',animation:'fadeUp .3s ease',animationDelay:`${i*.07}s`,animationFillMode:'both'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${w.color}18`,border:`1px solid ${w.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:w.color,fontSize:16,flexShrink:0}}>{w.icon}</div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:14}}>{w.name}</span>{w.live&&<Badge color="#10B981">● LIVE</Badge>}</div>
                <div style={{fontSize:10,color:'#555570',marginTop:2}}>Deposit address</div>
              </div>
            </div>
            <Badge color={w.color}>{w.network}</Badge>
          </div>
          <div style={{background:'#0D0D14',borderRadius:10,padding:'10px 12px',marginBottom:10}}><code style={{fontSize:11,color:'#888899',wordBreak:'break-all',lineHeight:1.6}}>{w.address}</code></div>
          <Btn variant={copied===w.name?'green':'ghost'} onClick={()=>copy(w.address,w.name)} style={{width:'100%',padding:'10px'}}>{copied===w.name?'✓ Copied!':'📋 Copy Address'}</Btn>
        </div>
      ))}
    </div>
  )
}

function Yields() {
  const data = [
    {name:'Curve Finance',   apy:8.2, tvl:'$4.2B',risk:'Low',   asset:'USDC/USDT',color:'#10B981',icon:'〜',chain:'ETH'},
    {name:'Aave V3',         apy:5.4, tvl:'$8.1B',risk:'Low',   asset:'USDC',     color:'#7C6AF7',icon:'Ξ', chain:'ETH'},
    {name:'Compound V3',     apy:4.8, tvl:'$2.3B',risk:'Low',   asset:'USDC',     color:'#00D395',icon:'C', chain:'ETH'},
    {name:'Convex Finance',  apy:12.1,tvl:'$1.8B',risk:'Medium',asset:'CRV/CVX',  color:'#F3BA2F',icon:'X', chain:'ETH'},
    {name:'NEAR Ref Finance',apy:9.3, tvl:'$180M',risk:'Medium',asset:'NEAR/USDC',color:'#00C08B',icon:'N', chain:'NEAR'},
  ]
  const avg = (data.reduce((s,y)=>s+y.apy,0)/data.length).toFixed(1)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700}}>🚚 Yields</h2>
        <Btn href={SITE.yields} target="_blank" variant="ghost" style={{fontSize:11,padding:'6px 12px'}}>Full Site →</Btn>
      </div>
      <div style={{background:'linear-gradient(135deg,#0D1A12,#0A130D)',border:'1px solid #1A3A24',borderRadius:14,padding:'16px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[{label:'Avg APY',value:`${avg}%`,color:'#10B981',icon:'📈'},{label:'Monthly',value:`~$${((6000*(avg/100))/12).toFixed(0)}`,color:'#10B981',icon:'💰'},{label:'Annual',value:`~$${(6000*(avg/100)).toFixed(0)}`,color:'#F3BA2F',icon:'🎯'}].map(s=>(
          <div key={s.label} style={{textAlign:'center'}}><div style={{fontSize:18,marginBottom:4}}>{s.icon}</div><div style={{fontSize:9,color:'#555570',marginBottom:2,textTransform:'uppercase'}}>{s.label}</div><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:s.color}}>{s.value}</div></div>
        ))}
      </div>
      {data.map((p,i)=>(
        <div key={p.name} style={{background:'#13131A',border:`1px solid ${p.color}30`,borderRadius:14,padding:'14px 16px',animation:'fadeUp .3s ease',animationDelay:`${i*.06}s`,animationFillMode:'both'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:`${p.color}18`,border:`1px solid ${p.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:p.color,fontSize:16,flexShrink:0}}>{p.icon}</div>
              <div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:14}}>{p.name}</div>
                <div style={{fontSize:11,color:'#555570',marginTop:2,display:'flex',alignItems:'center',gap:6}}>
                  <span>{p.asset}</span><Badge color={p.risk==='Low'?'#10B981':'#F3BA2F'}>{p.risk}</Badge>
                  <span style={{background:`${p.color}18`,color:p.color,padding:'1px 6px',borderRadius:4,fontSize:9}}>{p.chain}</span>
                </div>
              </div>
            </div>
            <div style={{textAlign:'right'}}><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:22,color:p.color}}>{p.apy}%</div><div style={{fontSize:10,color:'#555570'}}>APY</div></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════
   APP ROOT
═══════════════════════════════════════ */
export default function App() {
  const [view, setView]           = useState('dashboard')
  const [rules, setRules]         = useState(INIT_RULES)
  const [showModal, setShowModal] = useState(false)
  const [notif, setNotif]         = useState(null)
  const wallet  = useWallet()
  const { prices, changes, loading: pricesLoading, lastUpdate, refresh } = usePrices()

  useEffect(()=>{
    const t = setTimeout(()=>{ setNotif('🐋 0.001 ETH received · just now'); setTimeout(()=>setNotif(null),4000) },8000)
    return ()=>clearTimeout(t)
  },[])

  useEffect(()=>{
    if (wallet.connected) { setNotif(`✅ ${WALLETS_LIST.find(w=>w.id===wallet.walletType)?.name} connected!`); setTimeout(()=>setNotif(null),3000); setShowModal(false) }
  },[wallet.connected])

  return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',color:'#E8E8F0',fontFamily:"'DM Mono','Fira Code',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(500%)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        select option{background:#0D0D14} input::placeholder{color:#444460}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {showModal&&<WalletModal onConnect={wallet.connect} onClose={()=>setShowModal(false)} loading={wallet.loading} error={wallet.error}/>}
      {notif&&<div style={{position:'fixed',top:60,right:12,left:12,zIndex:999,background:'#0D1A12',border:'1px solid #1A3A24',borderRadius:12,padding:'11px 14px',fontSize:12,color:'#10B981',animation:'slideIn .3s ease',boxShadow:'0 4px 20px rgba(0,0,0,.6)',textAlign:'center'}}>{notif}</div>}

      <TopBar wallet={wallet} onOpenWallet={()=>setShowModal(true)}/>
      <PriceTicker prices={prices} changes={changes} loading={pricesLoading} lastUpdate={lastUpdate} onRefresh={refresh}/>

      <main style={{padding:'16px 16px 90px',maxWidth:600,margin:'0 auto'}}>
        {view==='dashboard'&&<Dashboard rules={rules} wallet={wallet} prices={prices} changes={changes} pricesLoading={pricesLoading}/>}
        {view==='rules'    &&<AutoRules rules={rules} setRules={setRules}/>}
        {view==='receive'  &&<ReceiveAssets wallet={wallet}/>}
        {view==='yields'   &&<Yields/>}
      </main>

      <BottomNav view={view} setView={setView}/>
    </div>
  )
}
