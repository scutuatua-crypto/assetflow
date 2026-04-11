// Simple Asset Monitor - Copy this entire file!

class AssetMonitor {
  constructor() {
    this.assets = {
      BTC: { balance: 0, received: 0 },
      ETH: { balance: 0, received: 0 },
      USUAL: { balance: 0, received: 0 },
      USDC: { balance: 0, received: 0 },
      NEAR: { balance: 0, received: 0 },
      SOL: { balance: 0, received: 0 }
    };
  }

  // When you receive a reward
  addReward(assetName, amount) {
    if (this.assets[assetName]) {
      this.assets[assetName].balance += amount;
      this.assets[assetName].received += amount;
      
      // Print to console
      console.log(`✨ RECEIVED: ${amount} ${assetName}`);
      console.log(`💰 NEW BALANCE: ${this.assets[assetName].balance}`);
      console.log(`📊 TOTAL RECEIVED: ${this.assets[assetName].received}`);
    }
  }

  // Show everything
  showAll() {
    console.clear();
    console.log('═══════════════════════════════════════');
    console.log('📊 YOUR ASSETS');
    console.log('═══════════════════════════════════════\n');
    
    Object.entries(this.assets).forEach(([name, data]) => {
      console.log(`${name}: ${data.balance} (Total received: ${data.received})`);
    });
  }
}

// Create it globally so you can use it anywhere
window.monitor = new AssetMonitor();
