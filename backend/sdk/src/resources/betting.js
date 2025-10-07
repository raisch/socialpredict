import { BaseResource } from './base.js'

/**
 * Betting resource for bet placement and position management
 */
export class BettingResource extends BaseResource {
  /**
   * Place a bet on a market outcome (requires authentication)
   * @param {Object} betData - Bet data
   * @param {number} betData.marketId - Market ID
   * @param {number} betData.amount - Bet amount
   * @param {string} betData.outcome - Bet outcome (e.g., 'yes', 'no')
   * @returns {Promise<Object>} Created bet
   * @example
   * const bet = await client.betting.placeBet({
   *   marketId: 123,
   *   amount: 100,
   *   outcome: 'yes'
   * });
   * console.log('Bet placed:', bet.id);
   */
  async placeBet (betData) {
    this.validateRequired(betData, ['marketId', 'amount', 'outcome'])

    if (betData.amount <= 0) {
      throw new Error('Bet amount must be greater than 0')
    }

    return await this.client.post('/v0/bet', betData)
  }

  /**
   * Get user position in a market (requires authentication)
   * @param {number} marketId - Market ID
   * @returns {Promise<Object>} User position in market
   * @example
   * const position = await client.betting.getUserPosition(123);
   */
  async getUserPosition (marketId) {
    if (!marketId) {
      throw new Error('Market ID is required')
    }

    return await this.client.get(`/v0/userposition/${marketId}`)
  }

  /**
   * Sell shares in a market position (requires authentication)
   * @param {Object} sellData - Sell data
   * @param {number} sellData.marketId - Market ID
   * @param {number} sellData.amount - Amount to sell
   * @param {string} sellData.outcome - Outcome to sell
   * @returns {Promise<void>}
   * @example
   * await client.betting.sellPosition({
   *   marketId: 123,
   *   amount: 50,
   *   outcome: 'yes'
   * });
   */
  async sellPosition (sellData) {
    this.validateRequired(sellData, ['marketId', 'amount', 'outcome'])

    if (sellData.amount <= 0) {
      throw new Error('Sell amount must be greater than 0')
    }

    return await this.client.post('/v0/sell', sellData)
  }
}
