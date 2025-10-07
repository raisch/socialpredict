import { SocialPredictError } from '../errors.js'

describe('SocialPredictError', () => {
  it('should create error with all properties', () => {
    const error = new SocialPredictError('Test error', 400, 'TEST_ERROR', {
      field: 'value'
    })

    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('TEST_ERROR')
    expect(error.data).toEqual({ field: 'value' })
    expect(error.name).toBe('SocialPredictError')
  })

  it('should create error with default values', () => {
    const error = new SocialPredictError('Test error')

    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(0)
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.data).toBeNull()
  })

  describe('Error type checking', () => {
    it('should identify network errors', () => {
      const error = new SocialPredictError('Network error', 0, 'NETWORK_ERROR')
      expect(error.isNetworkError()).toBe(true)
      expect(error.isAuthError()).toBe(false)
    })

    it('should identify auth errors', () => {
      const unauthorized = new SocialPredictError(
        'Unauthorized',
        401,
        'AUTH_ERROR'
      )
      const forbidden = new SocialPredictError('Forbidden', 403, 'AUTH_ERROR')

      expect(unauthorized.isAuthError()).toBe(true)
      expect(forbidden.isAuthError()).toBe(true)
      expect(unauthorized.isNetworkError()).toBe(false)
    })

    it('should identify validation errors', () => {
      const error = new SocialPredictError(
        'Invalid data',
        400,
        'VALIDATION_ERROR'
      )
      expect(error.isValidationError()).toBe(true)
      expect(error.isAuthError()).toBe(false)
    })

    it('should identify not found errors', () => {
      const error = new SocialPredictError('Not found', 404, 'NOT_FOUND')
      expect(error.isNotFoundError()).toBe(true)
      expect(error.isValidationError()).toBe(false)
    })

    it('should identify server errors', () => {
      const error500 = new SocialPredictError(
        'Server error',
        500,
        'SERVER_ERROR'
      )
      const error502 = new SocialPredictError(
        'Bad gateway',
        502,
        'SERVER_ERROR'
      )

      expect(error500.isServerError()).toBe(true)
      expect(error502.isServerError()).toBe(true)
      expect(error500.isValidationError()).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new SocialPredictError('Test error', 400, 'TEST_ERROR', {
        field: 'value'
      })
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'SocialPredictError',
        message: 'Test error',
        statusCode: 400,
        code: 'TEST_ERROR',
        data: { field: 'value' }
      })
    })
  })

  it('should be instanceof Error', () => {
    const error = new SocialPredictError('Test error')
    expect(error instanceof Error).toBe(true)
    expect(error instanceof SocialPredictError).toBe(true)
  })
})
