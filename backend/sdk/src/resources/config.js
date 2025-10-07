import { BaseResource } from './base.js'

/**
 * Configuration resource for app setup and statistics
 */
export class ConfigResource extends BaseResource {
  /**
   * Get home page data
   * @returns {Promise<Object>} Home response
   * @example
   * const home = await client.config.getHome();
   * console.log(home.message); // "Data From the Backend!"
   */
  async getHome () {
    return await this.client.get('/v0/home')
  }

  /**
   * Get application setup configuration
   * @returns {Promise<Object>} Economics configuration
   * @example
   * const config = await client.config.getSetup();
   * console.log('Initial balance:', config.user.initialAccountBalance);
   */
  async getSetup () {
    return await this.client.get('/v0/setup')
  }

  /**
   * Get application statistics
   * @returns {Promise<Object>} Statistics data
   * @example
   * const stats = await client.config.getStats();
   */
  async getStats () {
    return await this.client.get('/v0/stats')
  }

  /**
   * Get system metrics
   * @returns {Promise<Object>} System metrics
   * @example
   * const metrics = await client.config.getSystemMetrics();
   */
  async getSystemMetrics () {
    return await this.client.get('/v0/system/metrics')
  }

  /**
   * Get global leaderboard
   * @returns {Promise<Object>} Global leaderboard data
   * @example
   * const leaderboard = await client.config.getGlobalLeaderboard();
   */
  async getGlobalLeaderboard () {
    return await this.client.get('/v0/global/leaderboard')
  }
}
