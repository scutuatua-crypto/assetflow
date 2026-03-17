import { useState, useEffect, useCallback } from "react"

/* ═══════════════════════════════════════
   CONFIG
═══════════════════════════════════════ */
const SITE = {
  github: 'https://github.com/scutuatua-crypto',
  whaletrucker: 'https://scutuatua-crypto.github.io/whaletrucker-reef/',
  czonedive: 'https://scutuatua-crypto.github.io/czonedive-core/',
  yields: 'http://scutuatua-crypto.github.io/whaletrucker-reef/yields.html',
  dune: 'https://dune.com/scutua',
  telegram: 'https://t.me/scutua01',
  remix: 'https://remix.ethereum.org/',
}

// ERC20 Token addresses (Ethereum mainnet)
const TOKENS = {
  USDC:  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  symbol: 'USDC',  color: '#2775CA' },
  USUAL: { address: '0xC4441c2BE5d8fA8126822B9929CA0b81Ea0DE38E', decimals: 18, symbol: 'USUAL', color: '#8B5CF6' },
  USDT:  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6,  symbol: 'USDT',  color: '#26A17B' },
}

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

const NEAR_NODE = 'https://rpc.mainnet.near.org'

const WALLETS_LIST = [
  { id: 'metamask',    name: 'MetaMask',       icon: '🦊', desc: 'Browser extension',   color: '#F6851B' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', desc: 'Scan with any wallet', color: '#3B99FC' },
  { id: 'near',        name: 'NEAR Wallet',    icon: '🌊', desc: 'scutua.near',          color: '#00C08B' },
  { id: 'phantom',     name: 'Phantom',        icon: '👻', desc: 'Solana wallet',        color: '#AB9FF2' },
]

/* ═══════════════════════════════════════
   WALLET HOOKS
═══════════════════════════════════════ */
function useWallet() {
  const [connected, setConnected] = useState(false)
  const [walletType, setWalletType] = useState(null)
  const [address, setAddress] = useState(null)
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chainId, setChainId] = useState(null)

  // ── MetaMask ──────────────────────────
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed! Please install it from metamask.io')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const addr = accounts[0]
      const chain = await window.ethereum.request({ method: 'eth_chainId' })
      setAddress(addr)
      setChainId(parseInt(chain, 16))
      setWalletType('metamask')
      setConnected(true)
      await fetchEVMBalances(addr)

      // Listen for changes
      window.ethereum.on('accountsChanged', (accs) => {
        if (accs.length === 0) disconnect()
        else { setAddress(accs[0]); fetchEVMBalances(accs[0]) }
      })
      window.ethereum.on('chainChanged', () => window.location.reload())
    } catch (e) {
      setError(e.message || 'MetaMask connection failed')
    }
    setLoading(false)
  }, [])

  // ── EVM Balances (ETH + ERC20) ─────────
  const fetchEVMBalances = useCallback(async (addr) => {
    setLoading(true)
    try {
      const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.min.js')
      const provider = new ethers.BrowserProvider(window.ethereum)

      // ETH balance
      const ethBal = await provider.getBalance(addr)
      const ethFormatted = parseFloat(ethers.formatEther(ethBal))

      // ERC20 balances
      const tokenBals = {}
      for (const [sym, tok] of Object.entries(TOKENS)) {
        try {
          const contract = new ethers.Contract(tok.address, ERC20_ABI, provider)
          const bal = await contract.balanceOf(addr)
          tokenBals[sym] = parseFloat(ethers.formatUnits(bal, tok.decimals))
        } catch { tokenBals[sym] = 0 }
      }

      setBalances({ ETH: ethFormatted, ...tokenBals })
    } catch (e) {
      console.error('Balance fetch error:', e)
    }
    setLoading(false)
  }, [])

  // ── WalletConnect ─────────────────────
  const connectWalletConnect = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Dynamic import WalletConnect
      const { EthereumProvider } = await import('https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.17.0/dist/index.umd.js')
      const provider = await EthereumProvider.init({
        projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get free at cloud.walletconnect.com
        chains: [1],
        showQrModal: true,
      })
      await provider.connect()
      const accounts = provider.accounts
      const addr = accounts[0]
      setAddress(addr)
      setWalletType('walletconnect')
      setConnected(true)

      window.ethereum = provider
      await fetchEVMBalances(addr)
    } catch (e) {
      setError('WalletConnect: ' + (e.message || 'Connection failed'))
    }
    setLoading(false)
  }, [fetchEVMBalances])

  // ── NEAR Wallet ───────────────────────
  const connectNEAR = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // NEAR uses redirect-based auth
      const nearAccount = 'scutua.near'
      
      // Fetch NEAR balance via RPC
      const res = await fetch(NEAR_NODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'dontcare', method: 'query',
          params: { request_type: 'view_account', finality: 'final', account_id: nearAccount }
        })
      })
      const data = await res.json()
      if (data.result) {
        const nearBal = parseFloat(data.result.amount) / 1e24
        setAddress(nearAccount)
        setWalletType('near')
        setConnected(true)
        setBalances({ NEAR: nearBal })
      } else {
        setError('NEAR account not found')
      }
    } catch (e) {
      setError('NEAR connection failed: ' + e.message)
    }
    setLoading(false)
  }, [])

  // ── Phantom (Solana) ──────────────────
  const connectPhantom = useCallback(async () => {
    const phantom = window.solana || window.phantom?.solana
    if (!phantom?.isPhantom) {
      setError('Phantom not installed! Get it at phantom.app')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await phantom.connect()
      const addr = resp.publicKey.toString()
      setAddress(addr)
      setWalletType('phantom')
      setConnected(true)

      // Fetch SOL balance via Solana RPC
      const res = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'getBalance',
          params: [addr]
        })
      })
      const data = await res.json()
      const sol = (data.result?.value || 0) / 1e9
      setBalances({ SOL: sol })

      phantom.on('disconnect', disconnect)
    } catch (e) {
      setError('Phantom: ' + (e.message || 'Connection failed'))
    }
    setLoading(false)
  }, [])

  const disconnect = useCallback(() => {
    setConnected(false)
    setWalletType(null)
    setAddress(null)
    setBalances({})
    setChainId(null)
    setError(null)
    if (window.solana?.isPhantom) window.solana.disconnect()
  }, [])

  const connect = useCallback((type) => {
    const map = { metamask: connectMetaMask, walletconnect: connectWalletConnect, near: connectNEAR, phantom: connectPhantom }
    map[type]?.()
  }, [connectMetaMask, connectWalletConnect, connectNEAR, connectPhantom])

  // Auto-reconnect MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setWalletType('metamask')
          setConnected(true)
          fetchEVMBalances(accounts[0])
        }
      })
    }
  }, [])

  return { connected, walletType, address, balances, loading, error, chainId, connect, disconnect }
}

/* ═══════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════ */
function Sparkline({ positive, width=80, height=28 }) {
  const base = positive ? [18,22,17,25,20,28,22,30,26,35,29,40] : [40,36,40,32,36,28,33,25,30,22,26,20]
  const max = Math.max(...base), min = Math.min(...base)
  const pts = base.map((v,i) => { const x=(i/(base.length-1))*width; const y=height-((v-min)/(max-min))*(height-4)-2; return `${x},${y}` })
  const path = pts.map((p,i) => `${i===0?'M':'L'}${p}`).join(' ')
  const fill = path + ` L${width},${height} L0,${height} Z`
  const color = positive ? '#10B981' : '#EF4444'
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <path d={fill} fill={`${color}18`} />
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PulseRing({ color='#10B981', size=8 }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', width:size, height:size }}>
      <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:color, animation:'ping 1.5s cubic-bezier(0,0,.2,1) infinite', opacity:.5 }} />
      <span style={{ position:'relative', width:size, height:size, borderRadius:'50%', background:color }} />
    </span>
  )
}

function Card({ children, style={}, delay=0, glow }) {
  return (
    <div style={{ background:'#13131A', border:`1px solid ${glow?glow+'50':'#1E1E2E'}`, borderRadius:16, padding:20, animation:'fadeUp .35s ease both', animationDelay:`${delay}s`, boxShadow:glow?`0 0 24px ${glow}12`:'none', transition:'border-color .2s', ...style }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=glow?glow+'80':'#2D2D45'}
      onMouseLeave={e=>e.currentTarget.style.borderColor=glow?glow+'50':'#1E1E2E'}
    >{children}</div>
  )
}

function Badge({ children, color='#10B981' }) {
  return <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, fontWeight:500, background:`${color}18`, color, display:'inline-block' }}>{children}</span>
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={()=>onChange(!value)} style={{ width:40, height:22, borderRadius:11, background:value?'#7C6AF7':'#1E1E2E', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left:value?21:3, width:16, height:16, borderRadius:8, background:'#fff', transition:'left .2s' }} />
    </button>
  )
}

function Btn({ children, onClick, variant='primary', style={}, href, target, disabled }) {
  const base = { border:'none', cursor:disabled?'not-allowed':'pointer', borderRadius:10, fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, padding:'8px 16px', transition:'all .15s', display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', opacity:disabled?.5:1 }
  const v = { primary:{background:'#7C6AF7',color:'#fff'}, ghost:{background:'#13131A',color:'#666680',border:'1px solid #1E1E2E'}, danger:{background:'#EF444420',color:'#EF4444',border:'1px solid #EF444430'}, green:{background:'#10B98120',color:'#10B981',border:'1px solid #10B98130'} }
  const Tag = href ? 'a' : 'button'
  return <Tag href={href} target={target} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</Tag>
}

function Input({ placeholder, value, onChange, style={} }) {
  return (
    <input placeholder={placeholder} value={value} onChange={onChange}
      style={{ background:'#0D0D14', border:'1px solid #1E1E2E', color:'#E8E8F0', borderRadius:10, padding:'10px 14px', fontFamily:"'DM Mono',monospace", fontSize:13, outline:'none', width:'100%', ...style }}
      onFocus={e=>e.target.style.borderColor='#7C6AF7'} onBlur={e=>e.target.style.borderColor='#1E1E2E'}
    />
  )
}

function Sel({ children, value, onChange }) {
  return (
    <select value={value} onChange={onChange}
      style={{ background:'#0D0D14', border:'1px solid #1E1E2E', color:'#E8E8F0', borderRadius:10, padding:'10px 14px', fontFamily:"'DM Mono',monospace", fontSize:13, outline:'none', cursor:'pointer' }}
      onFocus={e=>e.target.style.borderColor='#7C6AF7'} onBlur={e=>e.target.style.borderColor='#1E1E2E'}
    >{children}</select>
  )
}

/* ── Wallet Connect Modal ─────────────── */
function WalletModal({ onConnect, onClose, loading, error }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#13131A', border:'1px solid #2D2D45', borderRadius:20, padding:28, width:'100%', maxWidth:420, animation:'fadeUp .3s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:20 }}>Connect Wallet</div>
            <div style={{ fontSize:12, color:'#666680', marginTop:4 }}>Choose your wallet to get started</div>
          </div>
          <button onClick={onClose} style={{ background:'#1E1E2E', border:'none', color:'#666680', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16 }}>✕</button>
        </div>

        {error && (
          <div style={{ background:'#EF444415', border:'1px solid #EF444430', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#EF4444', marginBottom:16 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {WALLETS_LIST.map(w => (
            <button key={w.id} onClick={()=>onConnect(w.id)} disabled={loading}
              style={{ background:'#0D0D14', border:`1px solid #1E1E2E`, borderRadius:12, padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all .15s', textAlign:'left' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=w.color+'60';e.currentTarget.style.background='#111118'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E1E2E';e.currentTarget.style.background='#0D0D14'}}
            >
              <div style={{ width:42, height:42, borderRadius:12, background:`${w.color}18`, border:`1px solid ${w.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{w.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14, color:'#E8E8F0' }}>{w.name}</div>
                <div style={{ fontSize:11, color:'#666680', marginTop:2 }}>{w.desc}</div>
              </div>
              {loading ? <div style={{ width:16, height:16, border:'2px solid #7C6AF7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/> : <span style={{ color:'#555570', fontSize:12 }}>→</span>}
            </button>
          ))}
        </div>

        <div style={{ marginTop:16, fontSize:11, color:'#555570', textAlign:'center' }}>
          By connecting, you agree to our terms. Your keys, your crypto. 🔒
        </div>
      </div>
    </div>
  )
}

/* ── Wallet Badge (navbar) ────────────── */
function WalletBadge({ connected, address, walletType, balances, onOpen, onDisconnect }) {
  const [showMenu, setShowMenu] = useState(false)
  const short = address ? (walletType==='near' ? address : `${address.slice(0,6)}...${address.slice(-4)}`) : null
  const walletInfo = WALLETS_LIST.find(w=>w.id===walletType)

  if (!connected) {
    return (
      <button onClick={onOpen} style={{ background:'linear-gradient(135deg,#7C6AF7,#4F46E5)', border:'none', color:'#fff', borderRadius:10, padding:'7px 14px', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
        🔗 Connect Wallet
      </button>
    )
  }

  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setShowMenu(!showMenu)}
        style={{ background:'#13131A', border:'1px solid #2D2D45', color:'#E8E8F0', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
        <span>{walletInfo?.icon}</span>
        <span style={{ color:'#10B981' }}>●</span>
        <span>{short}</span>
        <span style={{ color:'#666680' }}>▾</span>
      </button>
      {showMenu && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#13131A', border:'1px solid #2D2D45', borderRadius:12, padding:12, minWidth:200, zIndex:100, animation:'fadeUp .2s ease' }}>
          <div style={{ fontSize:11, color:'#666680', marginBottom:8 }}>Connected via {walletInfo?.name}</div>
          {Object.entries(balances).map(([sym,bal])=>(
            <div key={sym} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #1E1E2E', fontSize:13 }}>
              <span style={{ color:'#A0A0C0' }}>{sym}</span>
              <span style={{ fontWeight:500 }}>{bal.toFixed(4)}</span>
            </div>
          ))}
          <button onClick={()=>{onDisconnect();setShowMenu(false)}}
            style={{ marginTop:10, width:'100%', background:'#EF444415', border:'1px solid #EF444430', color:'#EF4444', borderRadius:8, padding:'7px', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:12 }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   VIEWS
═══════════════════════════════════════ */
const MOCK_ASSETS = [
  { id:1, symbol:'BTC', name:'Bitcoin', amount:0.05234, value:2156.78, change:5.2, color:'#F7931A', icon:'₿' },
  { id:2, symbol:'ETH', name:'Ethereum', amount:1.2456, value:2890.45, change:2.1, color:'#627EEA', icon:'Ξ' },
  { id:3, symbol:'USUAL', name:'USUAL Token', amount:1510000, value:39870.55, change:-1.8, color:'#8B5CF6', icon:'U' },
  { id:4, symbol:'USDC', name:'USD Coin', amount:5000, value:5000, change:0.01, color:'#2775CA', icon:'$' },
]

function Dashboard({ rules, wallet }) {
  const { connected, balances, address, walletType } = wallet

  // Merge real balances into assets
  const assets = MOCK_ASSETS.map(a => {
    const realBal = balances[a.symbol]
    if (realBal !== undefined) return { ...a, amount: realBal, value: realBal * (a.value / a.amount) }
    return a
  })

  const total = assets.reduce((s,a)=>s+a.value,0)
  const totalChange = assets.reduce((s,a)=>s+(a.value*a.change/100),0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Wallet Connected Banner */}
      {connected && (
        <div style={{ background:'linear-gradient(135deg,#0D1A12,#0A130D)', border:'1px solid #1A3A24', borderRadius:14, padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', animation:'fadeUp .3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <PulseRing color="#10B981" />
            <span style={{ fontSize:13, color:'#10B981', fontWeight:500 }}>Wallet Connected</span>
            <span style={{ fontSize:11, color:'#666680' }}>{WALLETS_LIST.find(w=>w.id===walletType)?.name}</span>
          </div>
          <code style={{ fontSize:11, color:'#A0A0C0' }}>
            {walletType==='near' ? address : `${address?.slice(0,8)}...${address?.slice(-6)}`}
          </code>
        </div>
      )}

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#13131A 0%,#1A1228 50%,#13131A 100%)', border:'1px solid #2D2D50', borderRadius:20, padding:28, position:'relative', overflow:'hidden', animation:'fadeUp .3s ease' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#7C6AF7,transparent)' }}/>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:20 }}>
          <div style={{ position:'absolute', width:'100%', height:2, background:'linear-gradient(90deg,transparent,rgba(124,106,247,.12),transparent)', animation:'scanline 5s linear infinite' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
              {connected ? '● Live Portfolio' : 'Total Portfolio'}
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:38, fontWeight:700, letterSpacing:'-.03em', lineHeight:1 }}>
              ${total.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
            <div style={{ marginTop:8, fontSize:13, color:'#10B981', display:'flex', alignItems:'center', gap:6 }}>
              <span>▲</span><span>+${Math.abs(totalChange).toFixed(2)}</span>
              <span style={{ color:'rgba(255,255,255,.3)' }}>today</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, minWidth:280 }}>
            {[{label:'Assets',value:assets.length},{label:'Active Rules',value:`${rules.filter(r=>r.active).length}/${rules.length}`},{label:'This Month',value:'+12.3%',color:'#10B981'}].map(s=>(
              <div key={s.label} style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color:s.color||'#E8E8F0' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        {assets.map((a,i)=>(
          <Card key={a.id} delay={i*.07} glow={a.color}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${a.color}18`, border:`1px solid ${a.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:a.color, fontWeight:700 }}>{a.icon}</div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14 }}>{a.name}</div>
                    {connected && balances[a.symbol]!==undefined && <Badge color="#10B981">LIVE</Badge>}
                  </div>
                  <div style={{ fontSize:11, color:'#666680', marginTop:2 }}>{a.symbol}</div>
                </div>
              </div>
              <Sparkline positive={a.change>0} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:20 }}>${a.value.toLocaleString('en',{maximumFractionDigits:2})}</div>
                <div style={{ fontSize:11, color:'#555570', marginTop:2 }}>{a.amount.toLocaleString(undefined,{maximumFractionDigits:6})} {a.symbol}</div>
              </div>
              <Badge color={a.change>0?'#10B981':'#EF4444'}>{a.change>0?'▲':'▼'} {Math.abs(a.change)}%</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* USUAL Banner */}
      <div style={{ background:'linear-gradient(135deg,#1A0E2E,#130D1F)', border:'1px solid #4C1D95', borderRadius:16, padding:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, animation:'fadeUp .4s ease .2s both' }}>
        <div>
          <div style={{ fontSize:11, color:'#8B5CF6', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>🐋 USUAL Unlock Monitor · czonedive-core</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700 }}>
            {connected && balances['USUAL'] ? balances['USUAL'].toLocaleString() : '1,510,000'} <span style={{ color:'#8B5CF6' }}>USUAL</span>
          </div>
          <div style={{ fontSize:12, color:'#666680', marginTop:4 }}>≈ $39,870.55 · @scutua · Market Rate: $0.0264</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn href={SITE.czonedive} target="_blank" variant="ghost">Tracker →</Btn>
          <Btn href="https://app.usual.money" target="_blank" variant="primary">Claim 🎁</Btn>
        </div>
      </div>

      {/* Dune Banner */}
      <div style={{ background:'#0D0D14', border:'1px solid #1E1E2E', borderRadius:16, padding:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, animation:'fadeUp .4s ease .3s both' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#FF6B2B18', border:'1px solid #FF6B2B30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📊</div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>Dune Analytics · ERC20 Monitor</div>
            <div style={{ fontSize:12, color:'#666680', marginTop:3 }}>Contract Balance & Flow · UNI · Ethereum · 7d</div>
          </div>
        </div>
        <Btn href={SITE.dune} target="_blank" variant="ghost">View Query →</Btn>
      </div>
    </div>
  )
}

function AutoRules({ rules, setRules }) {
  const [form, setForm] = useState({ asset:'', freq:'', amount:'' })
  const [added, setAdded] = useState(false)
  const toggle = (id) => setRules(r=>r.map(x=>x.id===id?{...x,active:!x.active}:x))
  const create = () => {
    if (!form.asset||!form.freq||!form.amount) return
    setRules(r=>[...r,{ id:Date.now(), name:`${form.asset} ${form.freq} Auto`, asset:form.asset, color:'#7C6AF7', freq:form.freq, amount:form.amount, next:'Tomorrow', active:true, totalRuns:0, totalValue:'$0' }])
    setForm({ asset:'', freq:'', amount:'' })
    setAdded(true); setTimeout(()=>setAdded(false),2000)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700 }}>⚡ Auto Rules</h2>
        <div style={{ fontSize:12, color:'#666680' }}>{rules.filter(r=>r.active).length} active · {rules.length} total</div>
      </div>
      {rules.map((r,i)=>(
        <Card key={r.id} delay={i*.08} glow={r.active?r.color:undefined} style={{ opacity:r.active?1:.55 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`${r.color}18`, border:`1px solid ${r.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:r.color, fontSize:13 }}>{r.asset}</div>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'#666680', marginTop:2 }}>Auto-receive {r.asset} · {r.freq}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Badge color={r.active?'#10B981':'#666680'}>{r.active?'ACTIVE':'PAUSED'}</Badge>
              <Toggle value={r.active} onChange={()=>toggle(r.id)} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
            {[{label:'Amount',val:r.amount},{label:'Frequency',val:r.freq},{label:'Next Run',val:r.next},{label:'Total Runs',val:r.totalRuns},{label:'Total In',val:r.totalValue}].map(s=>(
              <div key={s.label} style={{ background:'#0D0D14', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#555570', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" style={{ fontSize:12 }}>Edit</Btn>
            <Btn variant="ghost" style={{ fontSize:12 }} onClick={()=>toggle(r.id)}>{r.active?'Pause':'Resume'}</Btn>
            <Btn variant="danger" style={{ fontSize:12 }} onClick={()=>setRules(rx=>rx.filter(x=>x.id!==r.id))}>Remove</Btn>
          </div>
        </Card>
      ))}
      <div style={{ background:'linear-gradient(135deg,#0D1A12,#0A130D)', border:'1px solid #1A3A24', borderRadius:16, padding:20 }}>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, marginBottom:4 }}>✦ Quick Create</div>
        <div style={{ fontSize:12, color:'#666680', marginBottom:14 }}>Setup a new receiving rule in seconds</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10 }}>
          <Sel value={form.asset} onChange={e=>setForm(f=>({...f,asset:e.target.value}))}><option value="">Asset</option><option>BTC</option><option>ETH</option><option>USUAL</option><option>USDC</option><option>NEAR</option><option>SOL</option></Sel>
          <Sel value={form.freq} onChange={e=>setForm(f=>({...f,freq:e.target.value}))}><option value="">Frequency</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>On Unlock</option></Sel>
          <Input placeholder="Amount (e.g. $100)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
          <Btn variant={added?'green':'primary'} onClick={create} style={{ whiteSpace:'nowrap' }}>{added?'✓ Created!':'Create →'}</Btn>
        </div>
      </div>
    </div>
  )
}

function ReceiveAssets({ wallet }) {
  const [copied, setCopied] = useState('')
  const copy = (text, key) => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(key); setTimeout(()=>setCopied(''),2000) }

  const wallets = [
    { name:'Bitcoin', symbol:'BTC', address:'3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5', network:'BTC', color:'#F7931A', icon:'₿' },
    { name:'Ethereum', symbol:'ETH', address: wallet.connected && wallet.walletType!=='near'&&wallet.walletType!=='phantom' ? wallet.address : '0x742d35Cc6634C0532925a3b8D5C7C2955b4a18e5', network:'ETH', color:'#627EEA', icon:'Ξ', live: wallet.connected && wallet.walletType!=='near'&&wallet.walletType!=='phantom' },
    { name:'NEAR Protocol', symbol:'NEAR', address: wallet.connected && wallet.walletType==='near' ? wallet.address : 'scutua.near', network:'NEAR', color:'#00C08B', icon:'N', live: wallet.connected && wallet.walletType==='near' },
    { name:'Solana', symbol:'SOL', address: wallet.connected && wallet.walletType==='phantom' ? wallet.address : 'Connect Phantom', network:'SOL', color:'#AB9FF2', icon:'◎', live: wallet.connected && wallet.walletType==='phantom' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700 }}>📥 Receive Assets</h2>
      <div style={{ fontSize:12, color:'#666680', padding:'10px 14px', background:'#0D1A12', border:'1px solid #1A3A24', borderRadius:10 }}>
        ⚠️ Always verify the network before sending. Wrong network = lost funds.
      </div>
      {wallets.map((w,i)=>(
        <Card key={w.name} delay={i*.08} glow={w.color}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:`${w.color}18`, border:`1px solid ${w.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:w.color, fontSize:16 }}>{w.icon}</div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15 }}>{w.name}</div>
                  {w.live && <Badge color="#10B981">● LIVE</Badge>}
                </div>
                <div style={{ fontSize:11, color:'#666680', marginTop:2 }}>Deposit address</div>
              </div>
            </div>
            <Badge color={w.color}>{w.network}</Badge>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'#0D0D14', borderRadius:10, padding:'12px 14px' }}>
            <code style={{ flex:1, fontSize:12, color:'#A0A0C0', wordBreak:'break-all', lineHeight:1.5 }}>{w.address}</code>
            <Btn variant="ghost" onClick={()=>copy(w.address,w.name)} style={{ padding:'6px 12px', fontSize:12, flexShrink:0, background:copied===w.name?'#10B98120':undefined, color:copied===w.name?'#10B981':undefined }}>
              {copied===w.name?'✓ Copied!':'Copy'}
            </Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

function Yields() {
  const data = [
    { name:'Curve Finance', apy:8.2, tvl:'$4.2B', risk:'Low', asset:'USDC/USDT', color:'#10B981', icon:'〜', chain:'ETH' },
    { name:'Aave V3', apy:5.4, tvl:'$8.1B', risk:'Low', asset:'USDC', color:'#7C6AF7', icon:'Ξ', chain:'ETH' },
    { name:'Compound V3', apy:4.8, tvl:'$2.3B', risk:'Low', asset:'USDC', color:'#00D395', icon:'C', chain:'ETH' },
    { name:'Convex Finance', apy:12.1, tvl:'$1.8B', risk:'Medium', asset:'CRV/CVX', color:'#F3BA2F', icon:'X', chain:'ETH' },
    { name:'NEAR Ref Finance', apy:9.3, tvl:'$180M', risk:'Medium', asset:'NEAR/USDC', color:'#00C08B', icon:'N', chain:'NEAR' },
  ]
  const avg = (data.reduce((s,y)=>s+y.apy,0)/data.length).toFixed(1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700 }}>🚚 WhaleTrucker Yields</h2>
        <Btn href={SITE.whaletrucker} target="_blank" variant="ghost" style={{ fontSize:12 }}>Full Site →</Btn>
      </div>
      <div style={{ background:'linear-gradient(135deg,#0D1A12,#0A130D)', border:'1px solid #1A3A24', borderRadius:16, padding:24, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[{label:'Avg APY',value:`${avg}%`,color:'#10B981',icon:'📈'},{label:'Monthly Income',value:`~$${((6000*(avg/100))/12).toFixed(0)}`,color:'#10B981',icon:'💰',sub:'on $6,000 stake'},{label:'Annual Yield',value:`~$${(6000*(avg/100)).toFixed(0)}`,color:'#F3BA2F',icon:'🎯',sub:'passive income'}].map(s=>(
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:11, color:'#666680', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:24, color:s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:11, color:'#555570', marginTop:2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>
      {data.map((p,i)=>(
        <Card key={p.name} delay={i*.07} glow={p.color}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${p.color}18`, border:`1px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:p.color, fontSize:16 }}>{p.icon}</div>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'#666680', marginTop:3, display:'flex', alignItems:'center', gap:8 }}>
                  <span>{p.asset}</span><span>·</span><span>TVL {p.tvl}</span><span>·</span>
                  <span style={{ background:`${p.color}18`, color:p.color, padding:'1px 6px', borderRadius:4, fontSize:10 }}>{p.chain}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <Badge color={p.risk==='Low'?'#10B981':'#F3BA2F'}>{p.risk} Risk</Badge>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:24, color:p.color }}>{p.apy}%</div>
                <div style={{ fontSize:11, color:'#555570' }}>APY</div>
              </div>
              <Btn variant="primary" style={{ fontSize:12 }}>Invest →</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════
   APP
═══════════════════════════════════════ */
const NAV = [
  { key:'dashboard', label:'Dashboard', emoji:'📊' },
  { key:'rules',     label:'Auto Rules', emoji:'⚡' },
  { key:'receive',   label:'Receive',    emoji:'📥' },
  { key:'yields',    label:'Yields',     emoji:'🚚' },
]

const INIT_RULES = [
  { id:1, name:'BTC Weekly DCA', asset:'BTC', color:'#F7931A', freq:'Weekly', amount:'$100', next:'Tomorrow', active:true, totalRuns:14, totalValue:'$1,400' },
  { id:2, name:'ETH Monthly Stack', asset:'ETH', color:'#627EEA', freq:'Monthly', amount:'$500', next:'Mar 24', active:true, totalRuns:3, totalValue:'$1,500' },
  { id:3, name:'USUAL Harvest Monitor', asset:'USUAL', color:'#8B5CF6', freq:'On Unlock', amount:'1.51M', next:'Monitoring', active:true, totalRuns:1, totalValue:'$39,870' },
]

export default function App() {
  const [view, setView]   = useState('dashboard')
  const [rules, setRules] = useState(INIT_RULES)
  const [showModal, setShowModal] = useState(false)
  const [notif, setNotif] = useState(null)
  const wallet = useWallet()

  useEffect(()=>{
    const t = setTimeout(()=>{ setNotif('🐋 0.001 ETH received · just now'); setTimeout(()=>setNotif(null),4000) },5000)
    return ()=>clearTimeout(t)
  },[])

  // Show notif when wallet connects
  useEffect(()=>{
    if (wallet.connected) {
      setNotif(`✅ ${WALLETS_LIST.find(w=>w.id===wallet.walletType)?.name} connected!`)
      setTimeout(()=>setNotif(null),3000)
      setShowModal(false)
    }
  },[wallet.connected])

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', color:'#E8E8F0', fontFamily:"'DM Mono','Fira Code',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(500%)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A0A0F}::-webkit-scrollbar-thumb{background:#2D2D45;border-radius:2px}
        select option{background:#0D0D14}
      `}</style>

      {/* Wallet Modal */}
      {showModal && <WalletModal onConnect={wallet.connect} onClose={()=>setShowModal(false)} loading={wallet.loading} error={wallet.error} />}

      {/* Toast */}
      {notif && (
        <div style={{ position:'fixed', top:16, right:16, zIndex:999, background:'#0D1A12', border:'1px solid #1A3A24', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#10B981', animation:'slideIn .3s ease', boxShadow:'0 4px 24px rgba(0,0,0,.5)' }}>
          {notif}
        </div>
      )}

      {/* Navbar */}
      <nav style={{ borderBottom:'1px solid #1E1E2E', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:56, position:'sticky', top:0, background:'rgba(10,10,15,.92)', backdropFilter:'blur(16px)', zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          <a href={SITE.whaletrucker} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'inherit' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#7C6AF7,#4F46E5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🐋</div>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15 }}>WhaleTrucker</span>
            <span style={{ color:'#555570', fontSize:11 }}>/ AssetFlow</span>
          </a>
          <div style={{ display:'flex', gap:4 }}>
            {NAV.map(n=>(
              <button key={n.key} onClick={()=>setView(n.key)}
                style={{ background:view===n.key?'#13131A':'none', border:view===n.key?'1px solid #2D2D45':'1px solid transparent', color:view===n.key?'#7C6AF7':'#666680', cursor:'pointer', padding:'7px 13px', borderRadius:10, fontFamily:"'DM Mono',monospace", fontSize:13, display:'flex', alignItems:'center', gap:6, transition:'all .15s' }}
                onMouseEnter={e=>{if(view!==n.key){e.currentTarget.style.color='#E8E8F0';e.currentTarget.style.background='#13131A'}}}
                onMouseLeave={e=>{if(view!==n.key){e.currentTarget.style.color='#666680';e.currentTarget.style.background='none'}}}
              ><span>{n.emoji}</span>{n.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#10B981' }}>
            <PulseRing color="#10B981" /> LIVE
          </div>
          <WalletBadge {...wallet} onOpen={()=>setShowModal(true)} onDisconnect={wallet.disconnect} />
          <div style={{ display:'flex', gap:6 }}>
            {[{label:'GH',href:SITE.github},{label:'Dune',href:SITE.dune},{label:'TG',href:SITE.telegram}].map(l=>(
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                style={{ fontSize:11, color:'#555570', padding:'4px 8px', borderRadius:6, border:'1px solid #1E1E2E', textDecoration:'none', transition:'color .15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='#E8E8F0'} onMouseLeave={e=>e.currentTarget.style.color='#555570'}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ maxWidth:920, margin:'0 auto', padding:'28px 24px' }}>
        {view==='dashboard' && <Dashboard rules={rules} wallet={wallet} />}
        {view==='rules'     && <AutoRules rules={rules} setRules={setRules} />}
        {view==='receive'   && <ReceiveAssets wallet={wallet} />}
        {view==='yields'    && <Yields />}
      </main>

      <footer style={{ borderTop:'1px solid #1E1E2E', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'#555570', marginTop:40 }}>
        <span>🐋 WhaleTrucker · AssetFlow · @scutua</span>
        <div style={{ display:'flex', gap:16 }}>
          {[{label:'GitHub',href:SITE.github},{label:'Dune',href:SITE.dune},{label:'Tracker',href:SITE.czonedive},{label:'Yields',href:SITE.whaletrucker},{label:'Remix',href:SITE.remix}].map(l=>(
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
              style={{ color:'#555570', textDecoration:'none', transition:'color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#E8E8F0'} onMouseLeave={e=>e.currentTarget.style.color='#555570'}
            >{l.label}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
