import { BaseResource } from './base.js'

/**
 * Markets resource for market-related operations
 */
export class MarketsResource extends BaseResource {
  /**
   * List all markets (random selection, up to 100)
   * @returns {Promise<Object>} Markets list response
   * @example
   * const markets = await client.markets.list();
   * console.log('Found', markets.markets.length, 'markets');
   */
  async list () {
    return await this.client.get('/v0/markets')
  }

  /**
   * Search markets by query
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   * @example
   * const results = await client.markets.search('weather');
   * console.log('Search results:', results.markets);
   */
  async search (query) {
    if (!query) {
      throw new Error('Search query is required')
    }

    return await this.client.get('/v0/markets/search', { q: query })
  }

  /**
   * List active (unresolved) markets
   * @returns {Promise<Object>} Active markets response
   * @example
   * const activeMarkets = await client.markets.listActive();
   */
  async listActive () {
    return await this.client.get('/v0/markets/active')
  }

  /**
   * List closed markets
   * @returns {Promise<Object>} Closed markets response
   * @example
   * const closedMarkets = await client.markets.listClosed();
   */
  async listClosed () {
    return await this.client.get('/v0/markets/closed')
  }

  /**
   * List resolved markets
   * @returns {Promise<Object>} Resolved markets response
   * @example
   * const resolvedMarkets = await client.markets.listResolved();
   */
  async listResolved () {
    return await this.client.get('/v0/markets/resolved')
  }

  /**
   * Get market details by ID
   * @param {number} marketId - Market ID
   * @returns {Promise<Object>} Market details
   * @example
   * const market = await client.markets.get(123);
   * console.log('Market:', market.questionTitle);
   */
  async get (marketId) {
    if (!marketId) {
      throw new Error('Market ID is required')
    }

    return await this.client.get(`/v0/markets/${marketId}`)
  }

  /**
   * Project new probability for a potential bet
   * @param {Object} params - Projection parameters
   * @param {number} params.marketId - Market ID
   * @param {number} params.amount - Bet amount
   * @param {string} params.outcome - Bet outcome
   * @returns {Promise<Object>} Projection result
   * @example
   * const projection = await client.markets.projectProbability({
   *   marketId: 123,
   *   amount: 100,
   *   outcome: 'yes'
   * });
   * console.log('New probability:', projection.newProbability);
   */
  async projectProbability ({ marketId, amount, outcome }) {
    this.validateRequired({ marketId, amount, outcome }, [
      'marketId',
      'amount',
      'outcome'
    ])

    return await this.client.get(
      `/v0/marketprojection/${marketId}/${amount}/${outcome}/`
    )
  }

  /**
   * Get all bets for a market
   * @param {number} marketId - Market ID
   * @returns {Promise<Array>} Array of bets
   * @example
   * const bets = await client.markets.getBets(123);
   * console.log('Market has', bets.length, 'bets');
   */
  async getBets (marketId) {
    if (!marketId) {
      throw new Error('Market ID is required')
    }

    return await this.client.get(`/v0/markets/bets/${marketId}`)
  }

  /**
   * Get all positions for a market
   * @param {number} marketId - Market ID
   * @returns {Promise<Object>} Market positions
   * @example
   * const positions = await client.markets.getPositions(123);
   */
  async getPositions (marketId) {
    if (!marketId) {
      throw new Error('Market ID is required')
    }

    return await this.client.get(`/v0/markets/positions/${marketId}`)
  }

  /**
   * Get user positions in a market
   * @param {number} marketId - Market ID
   * @param {string} username - Username
   * @returns {Promise<Object>} User positions in market
   * @example
   * const userPositions = await client.markets.getUserPositions(123, 'johndoe');
   */
  async getUserPositions (marketId, username) {
    this.validateRequired({ marketId, username }, ['marketId', 'username'])

    return await this.client.get(
      `/v0/markets/positions/${marketId}/${username}`
    )
  }

  /**
   * Get market leaderboard
   * @param {number} marketId - Market ID
   * @returns {Promise<Object>} Market leaderboard
   * @example
   * const leaderboard = await client.markets.getLeaderboard(123);
   */
  async getLeaderboard (marketId) {
    if (!marketId) {
      throw new Error('Market ID is required')
    }

    return await this.client.get(`/v0/markets/leaderboard/${marketId}`)
  }

  /**
   * Create a new prediction market (requires authentication)
   * @param {Object} marketData - Market creation data
   * @param {string} marketData.questionTitle - Market question title
   * @param {string} marketData.description - Market description
   * @param {string} marketData.outcomeType - Outcome type (e.g., 'binary')
   * @param {string|Date} marketData.resolutionDateTime - Resolution date/time
   * @param {number} [marketData.utcOffset] - UTC offset
   * @param {number} [marketData.initialProbability] - Initial probability (0-1)
   * @returns {Promise<Object>} Created market
   * @example
   * const market = await client.markets.create({
   *   questionTitle: 'Will it rain tomorrow?',
   *   description: 'Weather prediction for tomorrow',
   *   outcomeType: 'binary',
   *   resolutionDateTime: '2025-10-08T12:00:00Z',
   *   initialProbability: 0.5
   * });
   */
  async create (marketData) {
    this.validateRequired(marketData, [
      'questionTitle',
      'description',
      'outcomeType',
      'resolutionDateTime'
    ])

    const data = {
      ...marketData,
      resolutionDateTime: this.formatDate(marketData.resolutionDateTime)
    }

    return await this.client.post('/v0/create', data)
  }

  /**
   * Resolve a market (requires authentication and permissions)
   * @param {number} marketId - Market ID
   * @param {string} resolutionResult - Resolution result
   * @returns {Promise<void>}
   * @example
   * await client.markets.resolve(123, 'yes');
   */
  async resolve (marketId, resolutionResult) {
    this.validateRequired({ marketId, resolutionResult }, [
      'marketId',
      'resolutionResult'
    ])

    return await this.client.post(`/v0/resolve/${marketId}`, {
      resolutionResult
    })
  }
}
