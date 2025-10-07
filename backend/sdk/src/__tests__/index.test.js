import SocialPredictClient, { SocialPredictError } from '../index.js'

describe('SocialPredictClient', () => {
  let client

  beforeEach(() => {
    client = new SocialPredictClient('http://localhost:8080')
  })

  describe('Constructor', () => {
    it('should create client with default base URL', () => {
      const defaultClient = new SocialPredictClient()
      expect(defaultClient.httpClient.baseURL).toBe('http://localhost:8080')
    })

    it('should create client with custom base URL', () => {
      const customClient = new SocialPredictClient('https://api.example.com')
      expect(customClient.httpClient.baseURL).toBe('https://api.example.com')
    })

    it('should create client with options', () => {
      const options = {
        token: 'test-token',
        timeout: 15000,
        headers: { 'X-Custom': 'value' }
      }

      const customClient = new SocialPredictClient(
        'http://localhost:8080',
        options
      )
      expect(customClient.httpClient.token).toBe('test-token')
      expect(customClient.httpClient.client.defaults.timeout).toBe(15000)
      expect(customClient.httpClient.client.defaults.headers['X-Custom']).toBe(
        'value'
      )
    })
  })

  describe('Resource initialization', () => {
    it('should initialize all resource instances', () => {
      expect(client.auth).toBeDefined()
      expect(client.markets).toBeDefined()
      expect(client.users).toBeDefined()
      expect(client.betting).toBeDefined()
      expect(client.config).toBeDefined()
      expect(client.admin).toBeDefined()
    })

    it('should pass http client to all resources', () => {
      expect(client.auth.client).toBe(client.httpClient)
      expect(client.markets.client).toBe(client.httpClient)
      expect(client.users.client).toBe(client.httpClient)
      expect(client.betting.client).toBe(client.httpClient)
      expect(client.config.client).toBe(client.httpClient)
      expect(client.admin.client).toBe(client.httpClient)
    })
  })

  describe('Token management', () => {
    it('should set token', () => {
      client.setToken('test-token')
      expect(client.httpClient.token).toBe('test-token')
    })

    it('should clear token', () => {
      client.setToken('test-token')
      client.clearToken()
      expect(client.httpClient.token).toBeNull()
    })

    it('should get token', () => {
      client.setToken('test-token')
      expect(client.getToken()).toBe('test-token')
    })

    it('should check authentication status', () => {
      expect(client.isAuthenticated()).toBe(false)

      client.setToken('test-token')
      expect(client.isAuthenticated()).toBe(true)

      client.clearToken()
      expect(client.isAuthenticated()).toBe(false)
    })
  })

  describe('Exports', () => {
    it('should export SocialPredictError', () => {
      expect(SocialPredictError).toBeDefined()

      const error = new SocialPredictError('Test error')
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('SocialPredictError')
    })

    it('should export client as default', () => {
      expect(SocialPredictClient).toBeDefined()

      const instance = new SocialPredictClient()
      expect(instance).toBeInstanceOf(SocialPredictClient)
    })
  })
})
