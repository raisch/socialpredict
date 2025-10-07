import { BaseResource } from './base.js'

/**
 * Admin resource for administrative operations
 */
export class AdminResource extends BaseResource {
  /**
   * Create a new user (requires admin privileges)
   * @param {Object} userData - User creation data
   * @param {string} userData.username - Username
   * @param {string} userData.displayName - Display name
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password
   * @param {string} userData.userType - User type
   * @returns {Promise<Object>} Created user
   * @example
   * const user = await client.admin.createUser({
   *   username: 'newuser',
   *   displayName: 'New User',
   *   email: 'newuser@example.com',
   *   password: 'securepassword',
   *   userType: 'standard'
   * });
   */
  async createUser (userData) {
    this.validateRequired(userData, [
      'username',
      'displayName',
      'email',
      'password',
      'userType'
    ])

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format')
    }

    return await this.client.post('/v0/admin/createuser', userData)
  }
}
