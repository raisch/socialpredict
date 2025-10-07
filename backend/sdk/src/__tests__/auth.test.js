import MockAdapter from 'axios-mock-adapter'
import { HttpClient } from '../http-client.js'
import { AuthResource } from '../resources/auth.js'

describe('AuthResource', () => {
  let httpClient
  let authResource
  let mock

  beforeEach(() => {
    httpClient = new HttpClient('http://localhost:8080')
    authResource = new AuthResource(httpClient)
    mock = new MockAdapter(httpClient.client)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('login', () => {
    const validCredentials = {
      username: 'testuser',
      password: 'testpass'
    }

    const loginResponse = {
      token: 'jwt-token-123',
      username: 'testuser',
      usertype: 'standard',
      mustChangePassword: false
    }

    it('should login successfully with valid credentials', async () => {
      mock.onPost('/v0/login', validCredentials).reply(200, loginResponse)

      const result = await authResource.login(validCredentials)

      expect(result).toEqual(loginResponse)
      expect(httpClient.token).toBe('jwt-token-123')
      expect(mock.history.post).toHaveLength(1)
      expect(JSON.parse(mock.history.post[0].data)).toEqual(validCredentials)
    })

    it('should throw error for missing username', async () => {
      const invalidCredentials = { password: 'testpass' }

      await expect(authResource.login(invalidCredentials)).rejects.toThrow(
        'Missing required parameters: username'
      )
    })

    it('should throw error for missing password', async () => {
      const invalidCredentials = { username: 'testuser' }

      await expect(authResource.login(invalidCredentials)).rejects.toThrow(
        'Missing required parameters: password'
      )
    })

    it('should throw error for short username', async () => {
      const invalidCredentials = { username: 'ab', password: 'testpass' }

      await expect(authResource.login(invalidCredentials)).rejects.toThrow(
        'Username must be between 3 and 30 characters'
      )
    })

    it('should throw error for long username', async () => {
      const invalidCredentials = {
        username: 'a'.repeat(31),
        password: 'testpass'
      }

      await expect(authResource.login(invalidCredentials)).rejects.toThrow(
        'Username must be between 3 and 30 characters'
      )
    })

    it('should throw error for empty password', async () => {
      const invalidCredentials = { username: 'testuser', password: '' }

      await expect(authResource.login(invalidCredentials)).rejects.toThrow(
        'Password must be at least 1 character'
      )
    })

    it('should handle login error response', async () => {
      mock.onPost('/v0/login').reply(401, {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      })

      await expect(authResource.login(validCredentials)).rejects.toThrow(
        'Invalid username or password'
      )
    })
  })

  describe('logout', () => {
    it('should clear token on logout', () => {
      httpClient.setToken('test-token')
      expect(httpClient.token).toBe('test-token')

      authResource.logout()

      expect(httpClient.token).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token is set', () => {
      httpClient.setToken('test-token')
      expect(authResource.isAuthenticated()).toBe(true)
    })

    it('should return false when token is not set', () => {
      expect(authResource.isAuthenticated()).toBe(false)
    })
  })

  describe('getToken', () => {
    it('should return current token', () => {
      httpClient.setToken('test-token')
      expect(authResource.getToken()).toBe('test-token')
    })

    it('should return null when no token', () => {
      expect(authResource.getToken()).toBeNull()
    })
  })

  describe('setToken', () => {
    it('should set token on client', () => {
      authResource.setToken('new-token')
      expect(httpClient.token).toBe('new-token')
    })
  })
})
