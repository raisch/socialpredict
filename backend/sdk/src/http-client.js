import axios from 'axios'
import { SocialPredictError } from './errors.js'

/**
 * Base HTTP client for SocialPredict API
 * Handles authentication, request/response processing, and error handling
 */
export class HttpClient {
  /**
   * Create an HTTP client instance
   * @param {string} baseURL - Base URL for the API
   * @param {Object} options - Configuration options
   * @param {string} options.token - JWT token for authentication
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {Object} options.headers - Additional headers
   */
  constructor (baseURL, options = {}) {
    this.baseURL = baseURL
    this.token = options.token || null

    this.client = axios.create({
      baseURL,
      timeout: options.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      config => {
        if (this.token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response
          throw new SocialPredictError(
            data.message || `HTTP ${status} Error`,
            status,
            data.error || 'API_ERROR',
            data
          )
        } else if (error.request || error.code === 'ECONNABORTED' || error.message === 'Network Error') {
          // Network error (covers axios-mock-adapter networkError() case)
          throw new SocialPredictError(
            'Network error - unable to reach server',
            0,
            'NETWORK_ERROR'
          )
        } else {
          // Other error
          throw new SocialPredictError(
            error.message || 'Unexpected error',
            0,
            'UNKNOWN_ERROR'
          )
        }
      }
    )
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken (token) {
    this.token = token
  }

  /**
   * Clear authentication token
   */
  clearToken () {
    this.token = null
  }

  /**
   * Make a GET request
   * @param {string} path - Request path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async get (path, params = {}) {
    const response = await this.client.get(path, { params })
    return response.data
  }

  /**
   * Make a POST request
   * @param {string} path - Request path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async post (path, data = {}) {
    const response = await this.client.post(path, data)
    return response.data
  }

  /**
   * Make a PUT request
   * @param {string} path - Request path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async put (path, data = {}) {
    const response = await this.client.put(path, data)
    return response.data
  }

  /**
   * Make a PATCH request
   * @param {string} path - Request path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async patch (path, data = {}) {
    const response = await this.client.patch(path, data)
    return response.data
  }

  /**
   * Make a DELETE request
   * @param {string} path - Request path
   * @returns {Promise<Object>} Response data
   */
  async delete (path) {
    const response = await this.client.delete(path)
    return response.data
  }
}
