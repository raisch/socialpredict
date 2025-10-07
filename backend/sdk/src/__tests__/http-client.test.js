import MockAdapter from 'axios-mock-adapter'
import { HttpClient } from '../http-client.js'
import { SocialPredictError } from '../errors.js'

describe('HttpClient', () => {
  let httpClient
  let mock

  beforeEach(() => {
    httpClient = new HttpClient('http://localhost:8080')
    mock = new MockAdapter(httpClient.client)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('Authentication', () => {
    it('should set token in request headers', async () => {
      httpClient.setToken('test-token')
      mock.onGet('/test').reply(200, { success: true })

      await httpClient.get('/test')

      expect(mock.history.get[0].headers.Authorization).toBe(
        'Bearer test-token'
      )
    })

    it('should not set token when not provided', async () => {
      mock.onGet('/test').reply(200, { success: true })

      await httpClient.get('/test')

      expect(mock.history.get[0].headers.Authorization).toBeUndefined()
    })

    it('should clear token', () => {
      httpClient.setToken('test-token')
      httpClient.clearToken()

      expect(httpClient.token).toBeNull()
    })
  })

  describe('HTTP Methods', () => {
    it('should make GET requests', async () => {
      const responseData = { data: 'test' }
      mock.onGet('/test', { params: { q: 'search' } }).reply(200, responseData)

      const result = await httpClient.get('/test', { q: 'search' })

      expect(result).toEqual(responseData)
      expect(mock.history.get).toHaveLength(1)
      expect(mock.history.get[0].params).toEqual({ q: 'search' })
    })

    it('should make POST requests', async () => {
      const requestData = { username: 'test' }
      const responseData = { token: 'jwt-token' }
      mock.onPost('/login', requestData).reply(200, responseData)

      const result = await httpClient.post('/login', requestData)

      expect(result).toEqual(responseData)
      expect(mock.history.post).toHaveLength(1)
      expect(JSON.parse(mock.history.post[0].data)).toEqual(requestData)
    })

    it('should make PUT requests', async () => {
      const requestData = { name: 'updated' }
      const responseData = { success: true }
      mock.onPut('/resource/1', requestData).reply(200, responseData)

      const result = await httpClient.put('/resource/1', requestData)

      expect(result).toEqual(responseData)
      expect(mock.history.put).toHaveLength(1)
    })

    it('should make PATCH requests', async () => {
      const requestData = { name: 'patched' }
      mock.onPatch('/resource/1', requestData).reply(200, {})

      await httpClient.patch('/resource/1', requestData)

      expect(mock.history.patch).toHaveLength(1)
    })

    it('should make DELETE requests', async () => {
      mock.onDelete('/resource/1').reply(204)

      await httpClient.delete('/resource/1')

      expect(mock.history.delete).toHaveLength(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      const errorData = { error: 'VALIDATION_ERROR', message: 'Invalid data' }
      mock.onGet('/test').reply(400, errorData)

      await expect(httpClient.get('/test')).rejects.toThrow(SocialPredictError)

      try {
        await httpClient.get('/test')
      } catch (error) {
        expect(error.statusCode).toBe(400)
        expect(error.code).toBe('VALIDATION_ERROR')
        expect(error.message).toBe('Invalid data')
        expect(error.data).toEqual(errorData)
      }
    })

    it('should handle network errors', async () => {
      mock.onGet('/test').networkError()

      await expect(httpClient.get('/test')).rejects.toThrow(SocialPredictError)

      try {
        await httpClient.get('/test')
      } catch (error) {
        expect(error.code).toBe('NETWORK_ERROR')
        expect(error.statusCode).toBe(0)
      }
    })

    it('should handle timeout errors', async () => {
      mock.onGet('/test').timeout()

      await expect(httpClient.get('/test')).rejects.toThrow(SocialPredictError)
    })
  })

  describe('Configuration', () => {
    it('should set custom timeout', () => {
      const customClient = new HttpClient('http://localhost:8080', {
        timeout: 5000
      })
      expect(customClient.client.defaults.timeout).toBe(5000)
    })

    it('should set custom headers', () => {
      const customHeaders = { 'X-Custom': 'value' }
      const customClient = new HttpClient('http://localhost:8080', {
        headers: customHeaders
      })
      expect(customClient.client.defaults.headers['X-Custom']).toBe('value')
    })

    it('should set base URL', () => {
      const customClient = new HttpClient('https://api.example.com')
      expect(customClient.client.defaults.baseURL).toBe(
        'https://api.example.com'
      )
    })
  })
})
