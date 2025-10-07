/**
 * Custom error class for SocialPredict API errors
 */
export class SocialPredictError extends Error {
  /**
   * Create a SocialPredict error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor (message, statusCode = 0, code = 'UNKNOWN_ERROR', data = null) {
    super(message)
    this.name = 'SocialPredictError'
    this.statusCode = statusCode
    this.code = code
    this.data = data
  }

  /**
   * Check if error is a network error
   * @returns {boolean}
   */
  isNetworkError () {
    return this.code === 'NETWORK_ERROR'
  }

  /**
   * Check if error is an authentication error
   * @returns {boolean}
   */
  isAuthError () {
    return this.statusCode === 401 || this.statusCode === 403
  }

  /**
   * Check if error is a validation error
   * @returns {boolean}
   */
  isValidationError () {
    return this.statusCode === 400
  }

  /**
   * Check if error is a not found error
   * @returns {boolean}
   */
  isNotFoundError () {
    return this.statusCode === 404
  }

  /**
   * Check if error is a server error
   * @returns {boolean}
   */
  isServerError () {
    return this.statusCode >= 500
  }

  /**
   * Convert error to JSON representation
   * @returns {Object}
   */
  toJSON () {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      data: this.data
    }
  }
}
