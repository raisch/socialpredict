import { HttpClient } from './http-client.js'
import { SocialPredictError } from './errors.js'
import { AuthResource } from './resources/auth.js'
import { MarketsResource } from './resources/markets.js'
import { UsersResource } from './resources/users.js'
import { BettingResource } from './resources/betting.js'
import { ConfigResource } from './resources/config.js'
import { AdminResource } from './resources/admin.js'

/**
 * SocialPredict API Client
 *
 * The main client class for interacting with the SocialPredict API.
 * Provides a clean, organized interface to all API endpoints.
 *
 * @example
 * // Create client instance
 * const client = new SocialPredictClient('http://localhost:8080');
 *
 * // Login and authenticate
 * await client.auth.login({ username: 'user', password: 'pass' });
 *
 * // Use API resources
 * const markets = await client.markets.list();
 * const bet = await client.betting.placeBet({
 *   marketId: 123,
 *   amount: 100,
 *   outcome: 'yes'
 * });
 */
export class SocialPredictClient {
  /**
   * Create a new SocialPredict client
   * @param {string} [baseURL='http://localhost:8080'] - Base URL for the API
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.token] - JWT token for authentication
   * @param {number} [options.timeout=10000] - Request timeout in milliseconds
   * @param {Object} [options.headers] - Additional headers
   * @example
   * // Basic usage
   * const client = new SocialPredictClient();
   *
   * // With custom configuration
   * const client = new SocialPredictClient('https://api.socialpredict.com', {
   *   token: 'your-jwt-token',
   *   timeout: 15000,
   *   headers: { 'X-Custom-Header': 'value' }
   * });
   */
  constructor (baseURL = 'http://localhost:8080', options = {}) {
    this.httpClient = new HttpClient(baseURL, options)

    // Initialize resource instances
    this.auth = new AuthResource(this.httpClient)
    this.markets = new MarketsResource(this.httpClient)
    this.users = new UsersResource(this.httpClient)
    this.betting = new BettingResource(this.httpClient)
    this.config = new ConfigResource(this.httpClient)
    this.admin = new AdminResource(this.httpClient)
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   * @example
   * client.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   */
  setToken (token) {
    this.httpClient.setToken(token)
  }

  /**
   * Clear authentication token
   * @example
   * client.clearToken();
   */
  clearToken () {
    this.httpClient.clearToken()
  }

  /**
   * Get current token
   * @returns {string|null} Current JWT token
   */
  getToken () {
    return this.httpClient.token
  }

  /**
   * Check if client is authenticated
   * @returns {boolean} True if token is set
   */
  isAuthenticated () {
    return !!this.httpClient.token
  }
}

// Export everything
export { SocialPredictError }
export default SocialPredictClient
