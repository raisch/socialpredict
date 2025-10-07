/**
 * Base class for API resources
 * Provides common functionality for all resource classes
 */
export class BaseResource {
  /**
   * Create a resource instance
   * @param {HttpClient} client - HTTP client instance
   */
  constructor (client) {
    this.client = client
  }

  /**
   * Validate required parameters
   * @param {Object} params - Parameters to validate
   * @param {string[]} required - Array of required parameter names
   * @throws {Error} If required parameters are missing
   */
  validateRequired (params, required) {
    const missing = required.filter(
      param => params[param] === undefined || params[param] === null
    )

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`)
    }
  }

  /**
   * Build query string from parameters
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  buildQuery (params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value)
      }
    })
    return query.toString()
  }

  /**
   * Format date for API requests
   * @param {Date|string} date - Date to format
   * @returns {string} ISO date string
   */
  formatDate (date) {
    if (date instanceof Date) {
      return date.toISOString()
    }
    return date
  }
}
