import { BaseResource } from './base.js'

/**
 * Users resource for user-related operations
 */
export class UsersResource extends BaseResource {
  /**
   * Get public user information
   * @param {string} username - Username
   * @returns {Promise<Object>} Public user data
   * @example
   * const user = await client.users.getPublicInfo('johndoe');
   * console.log('User:', user.displayname);
   */
  async getPublicInfo (username) {
    if (!username) {
      throw new Error('Username is required')
    }

    return await this.client.get(`/v0/userinfo/${username}`)
  }

  /**
   * Get user credit/balance information
   * @param {string} username - Username
   * @returns {Promise<Object>} User credit info
   * @example
   * const credit = await client.users.getCredit('johndoe');
   * console.log('Balance:', credit.accountBalance);
   */
  async getCredit (username) {
    if (!username) {
      throw new Error('Username is required')
    }

    return await this.client.get(`/v0/usercredit/${username}`)
  }

  /**
   * Get user portfolio
   * @param {string} username - Username
   * @returns {Promise<Object>} User portfolio
   * @example
   * const portfolio = await client.users.getPortfolio('johndoe');
   */
  async getPortfolio (username) {
    if (!username) {
      throw new Error('Username is required')
    }

    return await this.client.get(`/v0/portfolio/${username}`)
  }

  /**
   * Get user financial information
   * @param {string} username - Username
   * @returns {Promise<Object>} User financial data
   * @example
   * const financial = await client.users.getFinancial('johndoe');
   */
  async getFinancial (username) {
    if (!username) {
      throw new Error('Username is required')
    }

    return await this.client.get(`/v0/users/${username}/financial`)
  }

  /**
   * Get private profile (requires authentication)
   * @returns {Promise<Object>} Private profile data
   * @example
   * const profile = await client.users.getPrivateProfile();
   * console.log('Email:', profile.email);
   */
  async getPrivateProfile () {
    return await this.client.get('/v0/privateprofile')
  }

  /**
   * Change password (requires authentication)
   * @param {Object} passwordData - Password change data
   * @param {string} [passwordData.currentPassword] - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<void>}
   * @example
   * await client.users.changePassword({
   *   currentPassword: 'oldpass',
   *   newPassword: 'newpass'
   * });
   */
  async changePassword (passwordData) {
    this.validateRequired(passwordData, ['newPassword'])

    return await this.client.post('/v0/changepassword', passwordData)
  }

  /**
   * Change display name (requires authentication)
   * @param {string} displayName - New display name
   * @returns {Promise<void>}
   * @example
   * await client.users.changeDisplayName('John Doe');
   */
  async changeDisplayName (displayName) {
    if (!displayName) {
      throw new Error('Display name is required')
    }

    return await this.client.post('/v0/profilechange/displayname', {
      displayName
    })
  }

  /**
   * Change personal emoji (requires authentication)
   * @param {string} emoji - New emoji
   * @returns {Promise<void>}
   * @example
   * await client.users.changeEmoji('🚀');
   */
  async changeEmoji (emoji) {
    if (!emoji) {
      throw new Error('Emoji is required')
    }

    return await this.client.post('/v0/profilechange/emoji', { emoji })
  }

  /**
   * Change profile description (requires authentication)
   * @param {string} description - New description
   * @returns {Promise<void>}
   * @example
   * await client.users.changeDescription('Professional trader and market analyst');
   */
  async changeDescription (description) {
    if (!description) {
      throw new Error('Description is required')
    }

    return await this.client.post('/v0/profilechange/description', {
      description
    })
  }

  /**
   * Change personal links (requires authentication)
   * @param {Object} links - Personal links
   * @param {string} [links.personalLink1] - First personal link
   * @param {string} [links.personalLink2] - Second personal link
   * @param {string} [links.personalLink3] - Third personal link
   * @param {string} [links.personalLink4] - Fourth personal link
   * @returns {Promise<void>}
   * @example
   * await client.users.changePersonalLinks({
   *   personalLink1: 'https://twitter.com/johndoe',
   *   personalLink2: 'https://linkedin.com/in/johndoe'
   * });
   */
  async changePersonalLinks (links) {
    if (!links || typeof links !== 'object') {
      throw new Error('Links object is required')
    }

    return await this.client.post('/v0/profilechange/links', links)
  }
}
