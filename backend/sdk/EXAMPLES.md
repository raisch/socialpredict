# Usage Examples

Comprehensive examples demonstrating how to use the SocialPredict JavaScript SDK in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Authentication Patterns](#authentication-patterns)
- [Market Operations](#market-operations)
- [Betting Strategies](#betting-strategies)
- [User Management](#user-management)
- [Advanced Usage](#advanced-usage)
- [Integration Examples](#integration-examples)

## Basic Usage

### Simple Market Browser

```javascript
import SocialPredictClient from '@socialpredict/sdk';

async function browseMarkets() {
  const client = new SocialPredictClient('http://localhost:8080');

  try {
    // Login first
    await client.auth.login({
      username: 'your-username',
      password: 'your-password'
    });

    // Get all markets
    const response = await client.markets.list();
    console.log(`Found ${response.markets.length} markets`);

    // Display market information
    response.markets.forEach(({ market, probability }) => {
      console.log(`
Market: ${market.questionTitle}
Probability: ${(probability * 100).toFixed(1)}%
Status: ${market.marketStatus}
Resolution: ${new Date(market.resolutionDateTime).toLocaleDateString()}
      `);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

browseMarkets();
```

### Quick Bet Placement

```javascript
async function placeBetExample() {
  const client = new SocialPredictClient('http://localhost:8080');

  await client.auth.login({
    username: 'trader',
    password: 'password'
  });

  // Find a market to bet on
  const markets = await client.markets.search('weather');
  if (markets.markets.length === 0) {
    console.log('No weather markets found');
    return;
  }

  const market = markets.markets[0].market;
  console.log(`Betting on: ${market.questionTitle}`);

  // Project the outcome of our bet
  const projection = await client.markets.projectProbability({
    marketId: market.id,
    amount: 100,
    outcome: 'yes'
  });

  console.log(`Current probability: ${(projection.currentProbability * 100).toFixed(1)}%`);
  console.log(`New probability after bet: ${(projection.newProbability * 100).toFixed(1)}%`);

  // Place the bet if probability change is reasonable
  if (Math.abs(projection.newProbability - projection.currentProbability) < 0.1) {
    const bet = await client.betting.placeBet({
      marketId: market.id,
      amount: 100,
      outcome: 'yes'
    });

    console.log(`Bet placed successfully! ID: ${bet.id}`);
  } else {
    console.log('Bet would change probability too much, skipping');
  }
}
```

## Authentication Patterns

### Persistent Authentication

```javascript
class PersistentClient {
  constructor(apiUrl, tokenStorage = localStorage) {
    this.client = new SocialPredictClient(apiUrl);
    this.storage = tokenStorage;
    this.tokenKey = 'socialpredict-token';

    // Restore token if available
    this.restoreAuth();
  }

  async login(credentials) {
    try {
      const response = await this.client.auth.login(credentials);

      // Store token for future use
      this.storage.setItem(this.tokenKey, response.token);
      console.log('Login successful, token stored');

      return response;
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }

  logout() {
    this.client.auth.logout();
    this.storage.removeItem(this.tokenKey);
    console.log('Logged out and token cleared');
  }

  restoreAuth() {
    const token = this.storage.getItem(this.tokenKey);
    if (token) {
      this.client.setToken(token);
      console.log('Authentication restored from storage');
    }
  }

  isAuthenticated() {
    return this.client.isAuthenticated();
  }

  // Proxy methods to the underlying client
  get markets() { return this.client.markets; }
  get betting() { return this.client.betting; }
  get users() { return this.client.users; }
  get config() { return this.client.config; }
  get admin() { return this.client.admin; }
}

// Usage
const client = new PersistentClient('http://localhost:8080');

if (!client.isAuthenticated()) {
  await client.login({ username: 'user', password: 'pass' });
}

// Now you can use the client normally
const markets = await client.markets.list();
```

### Token Refresh Handler

```javascript
class AutoRefreshClient {
  constructor(apiUrl) {
    this.client = new SocialPredictClient(apiUrl);
    this.refreshCallback = null;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Add response interceptor to handle token expiration
    this.client.httpClient.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && this.refreshCallback) {
          console.log('Token expired, attempting refresh...');

          try {
            const newToken = await this.refreshCallback();
            this.client.setToken(newToken);

            // Retry original request
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client.httpClient.client.request(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw error;
          }
        }

        throw error;
      }
    );
  }

  setRefreshCallback(callback) {
    this.refreshCallback = callback;
  }

  async login(credentials) {
    return this.client.auth.login(credentials);
  }
}

// Usage
const client = new AutoRefreshClient('http://localhost:8080');

client.setRefreshCallback(async () => {
  // Implement your token refresh logic here
  // This might call your backend's refresh endpoint
  const response = await fetch('/api/refresh', {
    method: 'POST',
    credentials: 'include' // Include refresh token cookie
  });

  if (!response.ok) throw new Error('Refresh failed');

  const data = await response.json();
  return data.token;
});
```

## Market Operations

### Market Creation and Management

```javascript
async function createAndManageMarket() {
  const client = new SocialPredictClient('http://localhost:8080');
  await client.auth.login({ username: 'admin', password: 'admin-pass' });

  // Create a new market
  const market = await client.markets.create({
    questionTitle: 'Will Bitcoin reach $100,000 by end of 2024?',
    description: 'Market for Bitcoin price prediction. Resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD at any point before January 1, 2025.',
    outcomeType: 'binary',
    resolutionDateTime: '2025-01-01T00:00:00Z',
    initialProbability: 0.3,
    tags: ['cryptocurrency', 'bitcoin', 'price-prediction']
  });

  console.log(`Created market: ${market.questionTitle} (ID: ${market.id})`);

  // Monitor market activity
  const checkMarket = async () => {
    const bets = await client.markets.getBets(market.id);
    const positions = await client.markets.getPositions(market.id);

    console.log(`Market ${market.id} status:`);
    console.log(`- Total bets: ${bets.length}`);
    console.log(`- Active positions: ${positions.length}`);

    const totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);
    console.log(`- Total volume: $${totalVolume}`);

    if (totalVolume > 10000) {
      console.log('Market has reached high volume threshold');
    }
  };

  // Check every 5 minutes
  setInterval(checkMarket, 5 * 60 * 1000);

  // Initial check
  await checkMarket();
}
```

### Market Analysis

```javascript
class MarketAnalyzer {
  constructor(client) {
    this.client = client;
  }

  async analyzeMarket(marketId) {
    const [market, bets, positions] = await Promise.all([
      this.client.markets.get(marketId),
      this.client.markets.getBets(marketId),
      this.client.markets.getPositions(marketId)
    ]);

    return {
      market,
      metrics: this.calculateMetrics(bets),
      sentiment: this.analyzeSentiment(bets),
      risk: this.assessRisk(positions),
      recommendations: this.generateRecommendations(market, bets, positions)
    };
  }

  calculateMetrics(bets) {
    const yesBets = bets.filter(bet => bet.outcome === 'yes');
    const noBets = bets.filter(bet => bet.outcome === 'no');

    const totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const yesVolume = yesBets.reduce((sum, bet) => sum + bet.amount, 0);
    const noVolume = noBets.reduce((sum, bet) => sum + bet.amount, 0);

    const averageBetSize = totalVolume / bets.length;
    const volumeImbalance = Math.abs(yesVolume - noVolume) / totalVolume;

    return {
      totalVolume,
      yesVolume,
      noVolume,
      betCount: bets.length,
      averageBetSize,
      volumeImbalance,
      impliedProbability: yesVolume / totalVolume
    };
  }

  analyzeSentiment(bets) {
    const recentBets = bets
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Last 10 bets

    const recentYes = recentBets.filter(bet => bet.outcome === 'yes').length;
    const recentSentiment = recentYes / recentBets.length;

    return {
      recent: recentSentiment,
      trend: recentSentiment > 0.5 ? 'bullish' : 'bearish',
      confidence: Math.abs(recentSentiment - 0.5) * 2
    };
  }

  assessRisk(positions) {
    const totalExposure = positions.reduce((sum, pos) => sum + Math.abs(pos.amount), 0);
    const maxPosition = Math.max(...positions.map(pos => Math.abs(pos.amount)));
    const concentration = maxPosition / totalExposure;

    return {
      totalExposure,
      maxPosition,
      concentration,
      riskLevel: concentration > 0.3 ? 'high' : concentration > 0.15 ? 'medium' : 'low'
    };
  }

  generateRecommendations(market, bets, positions) {
    const metrics = this.calculateMetrics(bets);
    const risk = this.assessRisk(positions);

    const recommendations = [];

    if (metrics.volumeImbalance > 0.7) {
      recommendations.push({
        type: 'opportunity',
        message: 'High volume imbalance - consider betting on minority outcome',
        confidence: 0.8
      });
    }

    if (risk.concentration > 0.3) {
      recommendations.push({
        type: 'warning',
        message: 'High position concentration - market may be volatile',
        confidence: 0.9
      });
    }

    if (metrics.averageBetSize < 50) {
      recommendations.push({
        type: 'info',
        message: 'Small average bet size - retail-dominated market',
        confidence: 0.7
      });
    }

    return recommendations;
  }
}

// Usage
const client = new SocialPredictClient('http://localhost:8080');
await client.auth.login({ username: 'analyst', password: 'password' });

const analyzer = new MarketAnalyzer(client);
const analysis = await analyzer.analyzeMarket(123);

console.log('Market Analysis:');
console.log('Metrics:', analysis.metrics);
console.log('Sentiment:', analysis.sentiment);
console.log('Risk:', analysis.risk);
console.log('Recommendations:', analysis.recommendations);
```

## Betting Strategies

### Dollar-Cost Averaging Strategy

```javascript
class DCAStrategy {
  constructor(client, marketId, totalAmount, periods) {
    this.client = client;
    this.marketId = marketId;
    this.totalAmount = totalAmount;
    this.periods = periods;
    this.betAmount = totalAmount / periods;
    this.currentPeriod = 0;
  }

  async execute() {
    if (this.currentPeriod >= this.periods) {
      console.log('DCA strategy completed');
      return;
    }

    try {
      // Get current market state
      const market = await this.client.markets.get(this.marketId);
      const bets = await this.client.markets.getBets(this.marketId);

      const currentProb = this.calculateProbability(bets);
      console.log(`Period ${this.currentPeriod + 1}: Current probability ${(currentProb * 100).toFixed(1)}%`);

      // Determine outcome based on our belief
      const outcome = this.shouldBetYes(market, currentProb) ? 'yes' : 'no';

      // Place bet
      const bet = await this.client.betting.placeBet({
        marketId: this.marketId,
        amount: this.betAmount,
        outcome
      });

      console.log(`Placed ${outcome} bet of $${this.betAmount} (ID: ${bet.id})`);

      this.currentPeriod++;

      // Schedule next bet
      if (this.currentPeriod < this.periods) {
        setTimeout(() => this.execute(), 24 * 60 * 60 * 1000); // Daily
      }

    } catch (error) {
      console.error('DCA bet failed:', error.message);

      // Retry after delay
      setTimeout(() => this.execute(), 60 * 60 * 1000); // Retry in 1 hour
    }
  }

  calculateProbability(bets) {
    const yesVolume = bets
      .filter(bet => bet.outcome === 'yes')
      .reduce((sum, bet) => sum + bet.amount, 0);

    const totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);

    return totalVolume > 0 ? yesVolume / totalVolume : 0.5;
  }

  shouldBetYes(market, currentProb) {
    // Simple strategy: bet YES if we think probability is undervalued
    // In practice, you'd implement more sophisticated analysis
    return currentProb < 0.6 && market.questionTitle.toLowerCase().includes('bitcoin');
  }
}

// Usage
const client = new SocialPredictClient('http://localhost:8080');
await client.auth.login({ username: 'trader', password: 'password' });

const strategy = new DCAStrategy(client, 123, 1000, 10); // $1000 over 10 periods
await strategy.execute();
```

### Arbitrage Detector

```javascript
class ArbitrageDetector {
  constructor(client, minProfitMargin = 0.05) {
    this.client = client;
    this.minProfitMargin = minProfitMargin;
  }

  async findArbitrageOpportunities() {
    const markets = await this.client.markets.listActive();
    const opportunities = [];

    for (const { market, probability } of markets.markets) {
      const opportunity = await this.analyzeMarket(market, probability);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }

    return opportunities.sort((a, b) => b.expectedProfit - a.expectedProfit);
  }

  async analyzeMarket(market, currentProbability) {
    try {
      // Get current bets to calculate market probability
      const bets = await this.client.markets.getBets(market.id);
      const marketProbability = this.calculateMarketProbability(bets);

      // Check for significant probability discrepancy
      const probDifference = Math.abs(currentProbability - marketProbability);

      if (probDifference > 0.1) {
        // Simulate betting both outcomes to find arbitrage
        const arbitrage = await this.calculateArbitrage(market.id, marketProbability);

        if (arbitrage.profit > this.minProfitMargin) {
          return {
            market,
            currentProbability,
            marketProbability,
            arbitrage,
            expectedProfit: arbitrage.profit
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error analyzing market ${market.id}:`, error.message);
      return null;
    }
  }

  async calculateArbitrage(marketId, marketProbability) {
    const testAmount = 100;

    // Project outcomes for both sides
    const [yesProjection, noProjection] = await Promise.all([
      this.client.markets.projectProbability({
        marketId,
        amount: testAmount,
        outcome: 'yes'
      }),
      this.client.markets.projectProbability({
        marketId,
        amount: testAmount,
        outcome: 'no'
      })
    ]);

    // Calculate expected values
    const yesEV = this.calculateExpectedValue(testAmount, yesProjection, 'yes');
    const noEV = this.calculateExpectedValue(testAmount, noProjection, 'no');

    const bestOutcome = yesEV > noEV ? 'yes' : 'no';
    const profit = Math.max(yesEV, noEV) - testAmount;

    return {
      bestOutcome,
      profit: profit / testAmount, // Profit margin
      yesEV,
      noEV,
      yesProjection,
      noProjection
    };
  }

  calculateMarketProbability(bets) {
    const yesVolume = bets
      .filter(bet => bet.outcome === 'yes')
      .reduce((sum, bet) => sum + bet.amount, 0);

    const totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);

    return totalVolume > 0 ? yesVolume / totalVolume : 0.5;
  }

  calculateExpectedValue(amount, projection, outcome) {
    // Simplified EV calculation
    // In reality, you'd need to know the payout structure
    const probability = outcome === 'yes' ? projection.newProbability : (1 - projection.newProbability);
    const payout = amount / probability; // Simplified payout calculation

    return probability * payout;
  }
}

// Usage
const client = new SocialPredictClient('http://localhost:8080');
await client.auth.login({ username: 'arbitrage-bot', password: 'password' });

const detector = new ArbitrageDetector(client, 0.03); // 3% minimum profit
const opportunities = await detector.findArbitrageOpportunities();

console.log(`Found ${opportunities.length} arbitrage opportunities:`);
opportunities.forEach((opp, index) => {
  console.log(`${index + 1}. ${opp.market.questionTitle}`);
  console.log(`   Expected profit: ${(opp.expectedProfit * 100).toFixed(2)}%`);
  console.log(`   Best outcome: ${opp.arbitrage.bestOutcome}`);
});
```

## User Management

### User Portfolio Tracker

```javascript
class PortfolioTracker {
  constructor(client, username) {
    this.client = client;
    this.username = username;
  }

  async getFullPortfolio() {
    const [publicInfo, portfolio, credit] = await Promise.all([
      this.client.users.getPublicInfo(this.username),
      this.client.users.getPortfolio(this.username),
      this.client.users.getCredit(this.username)
    ]);

    return {
      user: publicInfo,
      portfolio,
      balance: credit,
      performance: this.calculatePerformance(portfolio),
      riskMetrics: this.calculateRiskMetrics(portfolio)
    };
  }

  calculatePerformance(portfolio) {
    const positions = portfolio.positions || [];

    const totalInvested = positions.reduce((sum, pos) => sum + Math.abs(pos.invested), 0);
    const currentValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const unrealizedPnL = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

    const winningPositions = positions.filter(pos => pos.currentValue > pos.invested).length;
    const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      unrealizedPnL,
      returnPercent,
      winRate,
      positionCount: positions.length
    };
  }

  calculateRiskMetrics(portfolio) {
    const positions = portfolio.positions || [];

    const positionSizes = positions.map(pos => Math.abs(pos.invested));
    const totalInvested = positionSizes.reduce((sum, size) => sum + size, 0);

    // Concentration risk
    const maxPosition = Math.max(...positionSizes);
    const concentration = totalInvested > 0 ? (maxPosition / totalInvested) * 100 : 0;

    // Diversification
    const marketCount = new Set(positions.map(pos => pos.marketId)).size;
    const avgPositionSize = totalInvested / positions.length;

    return {
      concentration,
      maxPosition,
      avgPositionSize,
      marketCount,
      diversificationScore: Math.min(100, (marketCount / positions.length) * 100)
    };
  }

  async generateReport() {
    const data = await this.getFullPortfolio();

    const report = `
# Portfolio Report for ${data.user.displayname}

## Summary
- **Balance**: $${data.balance.toFixed(2)}
- **Total Invested**: $${data.performance.totalInvested.toFixed(2)}
- **Current Value**: $${data.performance.currentValue.toFixed(2)}
- **Unrealized P&L**: $${data.performance.unrealizedPnL.toFixed(2)} (${data.performance.returnPercent.toFixed(2)}%)

## Performance Metrics
- **Win Rate**: ${data.performance.winRate.toFixed(1)}%
- **Total Positions**: ${data.performance.positionCount}
- **Average Position Size**: $${data.riskMetrics.avgPositionSize.toFixed(2)}

## Risk Metrics
- **Concentration**: ${data.riskMetrics.concentration.toFixed(1)}% (max position)
- **Markets**: ${data.riskMetrics.marketCount} unique markets
- **Diversification Score**: ${data.riskMetrics.diversificationScore.toFixed(1)}/100

## Recommendations
${this.generateRecommendations(data)}
    `;

    return report;
  }

  generateRecommendations(data) {
    const recommendations = [];

    if (data.riskMetrics.concentration > 30) {
      recommendations.push('⚠️ High concentration risk - consider diversifying largest position');
    }

    if (data.performance.winRate < 40) {
      recommendations.push('📈 Low win rate - review betting strategy');
    }

    if (data.riskMetrics.marketCount < 5 && data.performance.positionCount > 10) {
      recommendations.push('🌍 Consider diversifying across more markets');
    }

    if (data.performance.returnPercent > 20) {
      recommendations.push('🎉 Strong performance - consider taking some profits');
    }

    return recommendations.length > 0
      ? recommendations.map(rec => `- ${rec}`).join('\n')
      : '- ✅ Portfolio looks healthy!';
  }
}

// Usage
const client = new SocialPredictClient('http://localhost:8080');
await client.auth.login({ username: 'trader', password: 'password' });

const tracker = new PortfolioTracker(client, 'trader');
const report = await tracker.generateReport();
console.log(report);
```

### Automated Profile Updates

```javascript
class ProfileManager {
  constructor(client) {
    this.client = client;
  }

  async updateProfileFromPerformance() {
    const profile = await this.client.users.getPrivateProfile();
    const portfolio = await this.client.users.getPortfolio(profile.username);

    // Calculate performance
    const positions = portfolio.positions || [];
    const totalInvested = positions.reduce((sum, pos) => sum + Math.abs(pos.invested), 0);
    const currentValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const returnPercent = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    // Update emoji based on performance
    let emoji = '📈'; // Default
    if (returnPercent > 50) emoji = '🚀';
    else if (returnPercent > 20) emoji = '💎';
    else if (returnPercent > 0) emoji = '📈';
    else if (returnPercent > -10) emoji = '😐';
    else emoji = '📉';

    await this.client.users.changeEmoji(emoji);

    // Update description with performance
    const performanceText = `${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(1)}%`;
    const newDescription = `Prediction market trader | Current return: ${performanceText} | ${positions.length} active positions`;

    await this.client.users.changeDescription(newDescription);

    console.log(`Profile updated: ${emoji} ${newDescription}`);
  }

  async updateLinksWithTopMarkets() {
    const profile = await this.client.users.getPrivateProfile();
    const portfolio = await this.client.users.getPortfolio(profile.username);

    // Find top performing markets
    const positions = portfolio.positions || [];
    const topPositions = positions
      .sort((a, b) => (b.currentValue - b.invested) - (a.currentValue - a.invested))
      .slice(0, 2);

    if (topPositions.length > 0) {
      const links = {};

      if (topPositions[0]) {
        const market1 = await this.client.markets.get(topPositions[0].marketId);
        links.personalLink1 = `Best trade: ${market1.questionTitle}`;
      }

      if (topPositions[1]) {
        const market2 = await this.client.markets.get(topPositions[1].marketId);
        links.personalLink2 = `Second best: ${market2.questionTitle}`;
      }

      await this.client.users.changePersonalLinks(links);
      console.log('Updated personal links with top markets');
    }
  }
}

// Usage with automated updates
const client = new SocialPredictClient('http://localhost:8080');
await client.auth.login({ username: 'auto-trader', password: 'password' });

const profileManager = new ProfileManager(client);

// Update profile daily
setInterval(async () => {
  try {
    await profileManager.updateProfileFromPerformance();
    await profileManager.updateLinksWithTopMarkets();
  } catch (error) {
    console.error('Profile update failed:', error.message);
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

## Advanced Usage

### Market Making Bot

```javascript
class MarketMakingBot {
  constructor(client, config = {}) {
    this.client = client;
    this.config = {
      maxPositionSize: config.maxPositionSize || 1000,
      spreadTarget: config.spreadTarget || 0.05,
      rebalanceThreshold: config.rebalanceThreshold || 0.02,
      ...config
    };
    this.activeMarkets = new Set();
  }

  async startMarketMaking(marketIds) {
    console.log(`Starting market making for ${marketIds.length} markets`);

    for (const marketId of marketIds) {
      this.activeMarkets.add(marketId);
      this.maintainMarket(marketId);
    }
  }

  async maintainMarket(marketId) {
    while (this.activeMarkets.has(marketId)) {
      try {
        await this.rebalanceMarket(marketId);
        await this.sleep(30000); // Check every 30 seconds
      } catch (error) {
        console.error(`Error maintaining market ${marketId}:`, error.message);
        await this.sleep(60000); // Wait longer on error
      }
    }
  }

  async rebalanceMarket(marketId) {
    const [market, bets, position] = await Promise.all([
      this.client.markets.get(marketId),
      this.client.markets.getBets(marketId),
      this.client.betting.getUserPosition(marketId).catch(() => null)
    ]);

    const currentProb = this.calculateProbability(bets);
    const targetProb = this.calculateTargetProbability(market, bets);

    const probDifference = Math.abs(currentProb - targetProb);

    if (probDifference > this.config.rebalanceThreshold) {
      await this.placeMakingBets(marketId, currentProb, targetProb, position);
    }
  }

  async placeMakingBets(marketId, currentProb, targetProb, currentPosition) {
    const positionSize = currentPosition ? currentPosition.amount : 0;

    // Determine which side to bet on
    const shouldBetYes = currentProb < targetProb;
    const betSize = this.calculateBetSize(currentProb, targetProb, positionSize);

    if (betSize > 10 && Math.abs(positionSize + betSize) <= this.config.maxPositionSize) {
      const outcome = shouldBetYes ? 'yes' : 'no';

      const bet = await this.client.betting.placeBet({
        marketId,
        amount: Math.abs(betSize),
        outcome
      });

      console.log(`Market making bet: ${outcome} $${Math.abs(betSize)} on market ${marketId}`);
    }
  }

  calculateProbability(bets) {
    const yesVolume = bets
      .filter(bet => bet.outcome === 'yes')
      .reduce((sum, bet) => sum + bet.amount, 0);

    const totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);

    return totalVolume > 0 ? yesVolume / totalVolume : 0.5;
  }

  calculateTargetProbability(market, bets) {
    // Simple target: move toward theoretical fair value
    // In practice, you'd use sophisticated pricing models

    const timeToResolution = new Date(market.resolutionDateTime) - new Date();
    const daysToResolution = timeToResolution / (1000 * 60 * 60 * 24);

    // Adjust for time decay and volume
    const volumeWeight = Math.min(1, bets.length / 100);
    const timeWeight = Math.max(0.1, Math.min(1, daysToResolution / 30));

    // Target fair value (simplified)
    const fairValue = 0.5; // Would be calculated based on external data

    return fairValue * timeWeight + this.calculateProbability(bets) * (1 - timeWeight);
  }

  calculateBetSize(currentProb, targetProb, currentPosition) {
    const probDifference = targetProb - currentProb;
    const baseBetSize = Math.abs(probDifference) * 1000; // Scale factor

    // Adjust for current position
    const positionAdjustment = -currentPosition * 0.1;

    return Math.min(baseBetSize + positionAdjustment, this.config.maxPositionSize);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopMarketMaking(marketId) {
    this.activeMarkets.delete(marketId);
    console.log(`Stopped market making for market ${marketId}`);
  }
}

// Usage
const client = new SocialPredictClient('http://localhost:8080');
await client.auth.login({ username: 'market-maker', password: 'password' });

const bot = new MarketMakingBot(client, {
  maxPositionSize: 500,
  spreadTarget: 0.03,
  rebalanceThreshold: 0.015
});

const marketIds = [123, 124, 125]; // Markets to make
await bot.startMarketMaking(marketIds);
```

## Integration Examples

### Discord Bot Integration

```javascript
import { Client, GatewayIntentBits } from 'discord.js';
import SocialPredictClient from '@socialpredict/sdk';

class SocialPredictDiscordBot {
  constructor(discordToken, apiUrl) {
    this.discord = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });
    this.socialPredict = new SocialPredictClient(apiUrl);
    this.setupCommands();
  }

  setupCommands() {
    this.discord.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      const content = message.content.toLowerCase();

      if (content.startsWith('!markets')) {
        await this.handleMarketsCommand(message);
      } else if (content.startsWith('!bet')) {
        await this.handleBetCommand(message);
      } else if (content.startsWith('!portfolio')) {
        await this.handlePortfolioCommand(message);
      }
    });
  }

  async handleMarketsCommand(message, limit = 5) {
    try {
      const markets = await this.socialPredict.markets.list();
      const topMarkets = markets.markets.slice(0, limit);

      const embed = {
        title: '🎯 Top Prediction Markets',
        color: 0x0099ff,
        fields: topMarkets.map(({ market, probability }) => ({
          name: market.questionTitle,
          value: `Probability: ${(probability * 100).toFixed(1)}% | ID: ${market.id}`,
          inline: false
        })),
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply(`❌ Error fetching markets: ${error.message}`);
    }
  }

  async handleBetCommand(message) {
    const args = message.content.split(' ');
    // !bet <marketId> <amount> <outcome>

    if (args.length !== 4) {
      await message.reply('Usage: `!bet <marketId> <amount> <yes|no>`');
      return;
    }

    const [, marketId, amount, outcome] = args;

    try {
      // Note: In production, you'd need user authentication
      const bet = await this.socialPredict.betting.placeBet({
        marketId: parseInt(marketId),
        amount: parseFloat(amount),
        outcome: outcome.toLowerCase()
      });

      await message.reply(`✅ Bet placed! ID: ${bet.id} | ${outcome} for $${amount}`);
    } catch (error) {
      await message.reply(`❌ Bet failed: ${error.message}`);
    }
  }

  async handlePortfolioCommand(message) {
    const username = message.author.username; // Simplified mapping

    try {
      const [portfolio, credit] = await Promise.all([
        this.socialPredict.users.getPortfolio(username),
        this.socialPredict.users.getCredit(username)
      ]);

      const positions = portfolio.positions || [];
      const totalInvested = positions.reduce((sum, pos) => sum + Math.abs(pos.invested), 0);

      const embed = {
        title: `💼 ${username}'s Portfolio`,
        color: 0x00ff00,
        fields: [
          { name: 'Balance', value: `$${credit.toFixed(2)}`, inline: true },
          { name: 'Total Invested', value: `$${totalInvested.toFixed(2)}`, inline: true },
          { name: 'Active Positions', value: positions.length.toString(), inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply(`❌ Error fetching portfolio: ${error.message}`);
    }
  }

  async start() {
    await this.discord.login(process.env.DISCORD_TOKEN);
    console.log('Discord bot started');
  }
}

// Usage
const bot = new SocialPredictDiscordBot(
  'your-discord-token',
  'http://localhost:8080'
);

await bot.start();
```

### Express.js API Wrapper

```javascript
import express from 'express';
import SocialPredictClient from '@socialpredict/sdk';

class SocialPredictAPI {
  constructor() {
    this.app = express();
    this.client = new SocialPredictClient('http://localhost:8080');
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());

    // Authentication middleware
    this.app.use('/api', async (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        this.client.setToken(token);
      }

      next();
    });
  }

  setupRoutes() {
    // Markets endpoints
    this.app.get('/api/markets', async (req, res) => {
      try {
        const markets = await this.client.markets.list();
        res.json(markets);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/markets/search', async (req, res) => {
      try {
        const { q } = req.query;
        const results = await this.client.markets.search(q);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/markets/:id/bet', async (req, res) => {
      try {
        const { id } = req.params;
        const { amount, outcome } = req.body;

        const bet = await this.client.betting.placeBet({
          marketId: parseInt(id),
          amount,
          outcome
        });

        res.status(201).json(bet);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // User endpoints
    this.app.get('/api/users/:username/portfolio', async (req, res) => {
      try {
        const { username } = req.params;
        const portfolio = await this.client.users.getPortfolio(username);
        res.json(portfolio);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Authentication endpoints
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const response = await this.client.auth.login({ username, password });
        res.json(response);
      } catch (error) {
        res.status(401).json({ error: error.message });
      }
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`SocialPredict API wrapper running on port ${port}`);
    });
  }
}

// Usage
const api = new SocialPredictAPI();
api.start(3000);
```

### React Native Mobile App

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import SocialPredictClient from '@socialpredict/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SocialPredictApp = () => {
  const [client] = useState(() => new SocialPredictClient('http://localhost:8080'));
  const [markets, setMarkets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Try to restore authentication
      const token = await AsyncStorage.getItem('socialpredict-token');
      if (token) {
        client.setToken(token);
        await loadUserProfile();
      }

      await loadMarkets();
    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await client.users.getPrivateProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadMarkets = async () => {
    try {
      const response = await client.markets.list();
      setMarkets(response.markets);
    } catch (error) {
      console.error('Failed to load markets:', error);
    }
  };

  const placeBet = async (marketId, amount, outcome) => {
    try {
      await client.betting.placeBet({ marketId, amount, outcome });
      Alert.alert('Success', 'Bet placed successfully!');
      await loadMarkets(); // Refresh markets
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderMarket = ({ item }) => {
    const { market, probability } = item;

    return (
      <View style={styles.marketCard}>
        <Text style={styles.marketTitle}>{market.questionTitle}</Text>
        <Text style={styles.probability}>
          Probability: {(probability * 100).toFixed(1)}%
        </Text>

        <View style={styles.betButtons}>
          <TouchableOpacity
            style={[styles.betButton, styles.yesButton]}
            onPress={() => placeBet(market.id, 10, 'yes')}
          >
            <Text style={styles.buttonText}>Bet YES ($10)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.betButton, styles.noButton]}
            onPress={() => placeBet(market.id, 10, 'no')}
          >
            <Text style={styles.buttonText}>Bet NO ($10)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SocialPredict</Text>
        {user && <Text style={styles.welcome}>Welcome, {user.displayname}</Text>}
      </View>

      <FlatList
        data={markets}
        renderItem={renderMarket}
        keyExtractor={(item) => item.market.id.toString()}
        style={styles.marketsList}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#0099ff',
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  welcome: {
    fontSize: 16,
    color: 'white',
    marginTop: 5
  },
  marketsList: {
    flex: 1,
    padding: 10
  },
  marketCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  probability: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  betButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  betButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  yesButton: {
    backgroundColor: '#4CAF50'
  },
  noButton: {
    backgroundColor: '#f44336'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
};

export default SocialPredictApp;
```

This examples document provides comprehensive usage patterns for the SocialPredict JavaScript SDK, covering everything from basic operations to advanced trading strategies and integrations with popular platforms.