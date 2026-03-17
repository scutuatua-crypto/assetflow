# 🐋 WhaleTrucker · AssetFlow

Automatic Asset Receiving Platform — part of the WhaleTrucker ecosystem.

## Stack
- React 18 + Vite 5
- Pure CSS (no Tailwind needed)
- Deploy-ready for Vercel

## Ecosystem Links
- 🚚 [WhaleTrucker Reef](https://scutuatua-crypto.github.io/whaletrucker-reef/) — DeFi Yields
- 🐋 [CzoneDive Core](https://scutuatua-crypto.github.io/czonedive-core/) — USUAL Unlock Tracker  
- 📊 [Dune Analytics](https://dune.com/scutua) — ERC20 Contract Monitor
- 💬 [Telegram](https://t.me/scutua01)

## Deploy to Vercel (3 steps)

```bash
# 1. Clone / push to GitHub repo
git init
git add .
git commit -m "🐋 AssetFlow v1"
git remote add origin https://github.com/scutuatua-crypto/assetflow.git
git push -u origin main

# 2. Go to vercel.com → New Project → Import from GitHub
# 3. Select repo → Deploy ✅ (Vercel auto-detects Vite)
```

## Dev locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Build

```bash
npm run build
# → dist/ folder ready
```

## Features
- 📊 Portfolio dashboard with live sparklines
- ⚡ Auto-rules with toggle on/off + create new
- 📥 Receive Assets — wallet addresses + copy
- 🚚 Yields tracker (Curve, Aave, Compound, Convex, NEAR)
- 🐋 USUAL Unlock monitor banner → czonedive-core
- 📊 Dune ERC20 query link
- 🔔 Live notification toast
- GitHub / Dune / TG links in navbar
