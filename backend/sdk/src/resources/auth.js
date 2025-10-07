import { BaseResource } from './base.js'

/**
 * Authentication resource for login and token management
 */
export class AuthResource extends BaseResource {
  /**
   * Authenticate user and get JWT token
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.username - Username (3-30 characters)
   * @param {string} credentials.password - Password (minimum 1 character)
   * @returns {Promise<Object>} Login response with token and user info
   * @example
   * const response = await client.auth.login({
   *   username: 'johndoe',
   *   password: 'securepassword'
   * });
   * console.log('Token:', response.token);
   * console.log('User:', response.username);
   */
  async login (credentials) {
    this.validateRequired(credentials, ['username', 'password'])

    if (credentials.username.length < 3 || credentials.username.length > 30) {
      throw new Error('Username must be between 3 and 30 characters')
    }

    if (credentials.password.length < 1) {
      throw new Error('Password must be at least 1 character')
    }

    const response = await this.client.post('/v0/login', credentials)

    // Automatically set the token in the client
    if (response.token) {
      this.client.setToken(response.token)
    }

    return response
  }

  /**
   * Logout user (clears token from client)
   * @example
   * client.auth.logout();
   */
  logout () {
    this.client.clearToken()
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if token is set
   */
  isAuthenticated () {
    return !!this.client.token
  }

  /**
   * Get current token
   * @returns {string|null} Current JWT token
   */
  getToken () {
    return this.client.token
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   * @example
   * client.auth.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   */
  setToken (token) {
    this.client.setToken(token)
  }
}
