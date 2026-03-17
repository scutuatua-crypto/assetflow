export const SITE = {
  name: 'WhaleTrucker',
  sub: 'AssetFlow',
  github: 'https://github.com/scutuatua-crypto',
  whaletrucker: 'https://scutuatua-crypto.github.io/whaletrucker-reef/',
  czonedive: 'https://scutuatua-crypto.github.io/czonedive-core/',
  yields: 'http://scutuatua-crypto.github.io/whaletrucker-reef/yields.html',
  dune: 'https://dune.com/scutua',
  telegram: 'https://t.me/scutua01',
  remix: 'https://remix.ethereum.org/',
}

export const WALLETS = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    address: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
    network: 'BTC',
    color: '#F7931A',
    icon: '₿',
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    address: '0x742d35Cc6634C0532925a3b8D5C7C2955b4a18e5',
    network: 'ETH',
    color: '#627EEA',
    icon: 'Ξ',
  },
  {
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    address: '0x742d35Cc6634C0532925a3b8D5C7C2955b4a18e5',
    network: 'BSC',
    color: '#F3BA2F',
    icon: 'B',
  },
  {
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    address: 'scutua.near',
    network: 'NEAR',
    color: '#00C08B',
    icon: 'N',
  },
]

export const ASSETS = [
  {
    id: 1, symbol: 'BTC', name: 'Bitcoin',
    amount: 0.05234, value: 2156.78, change: 5.2,
    color: '#F7931A', icon: '₿',
    sparkUp: true,
  },
  {
    id: 2, symbol: 'ETH', name: 'Ethereum',
    amount: 1.2456, value: 2890.45, change: 2.1,
    color: '#627EEA', icon: 'Ξ',
    sparkUp: true,
  },
  {
    id: 3, symbol: 'USUAL', name: 'USUAL Token',
    amount: 1510000, value: 39870.55, change: -1.8,
    color: '#8B5CF6', icon: 'U',
    sparkUp: false,
  },
  {
    id: 4, symbol: 'USDC', name: 'USD Coin',
    amount: 5000, value: 5000, change: 0.01,
    color: '#2775CA', icon: '$',
    sparkUp: true,
  },
]

export const RULES = [
  {
    id: 1, name: 'BTC Weekly DCA',
    asset: 'BTC', color: '#F7931A',
    freq: 'Weekly', amount: '$100',
    next: 'Tomorrow', active: true,
    totalRuns: 14, totalValue: '$1,400',
  },
  {
    id: 2, name: 'ETH Monthly Stack',
    asset: 'ETH', color: '#627EEA',
    freq: 'Monthly', amount: '$500',
    next: 'Mar 24', active: true,
    totalRuns: 3, totalValue: '$1,500',
  },
  {
    id: 3, name: 'USUAL Harvest Monitor',
    asset: 'USUAL', color: '#8B5CF6',
    freq: 'On Unlock', amount: '1.51M',
    next: 'Monitoring', active: true,
    totalRuns: 1, totalValue: '$39,870',
  },
]

export const YIELDS = [
  {
    name: 'Curve Finance', apy: 8.2, tvl: '$4.2B',
    risk: 'Low', asset: 'USDC/USDT', color: '#10B981',
    icon: '〜', chain: 'ETH',
  },
  {
    name: 'Aave V3', apy: 5.4, tvl: '$8.1B',
    risk: 'Low', asset: 'USDC', color: '#7C6AF7',
    icon: 'Ξ', chain: 'ETH',
  },
  {
    name: 'Compound V3', apy: 4.8, tvl: '$2.3B',
    risk: 'Low', asset: 'USDC', color: '#00D395',
    icon: 'C', chain: 'ETH',
  },
  {
    name: 'Convex Finance', apy: 12.1, tvl: '$1.8B',
    risk: 'Medium', asset: 'CRV/CVX', color: '#F3BA2F',
    icon: 'X', chain: 'ETH',
  },
  {
    name: 'NEAR Ref Finance', apy: 9.3, tvl: '$180M',
    risk: 'Medium', asset: 'NEAR/USDC', color: '#00C08B',
    icon: 'N', chain: 'NEAR',
  },
]

export const DUNE_QUERY = {
  title: 'Contract Balance & Flow',
  subtitle: 'ERC20 Token Monitor',
  symbol: 'UNI',
  chain: 'ethereum',
  days: 7,
  minBalance: 90000,
  url: 'https://dune.com/scutua',
}
