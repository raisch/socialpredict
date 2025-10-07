import MockAdapter from 'axios-mock-adapter'
import { HttpClient } from '../http-client.js'
import { BettingResource } from '../resources/betting.js'

describe('BettingResource', () => {
  let httpClient
  let bettingResource
  let mock

  beforeEach(() => {
    httpClient = new HttpClient('http://localhost:8080')
    bettingResource = new BettingResource(httpClient)
    mock = new MockAdapter(httpClient.client)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('placeBet', () => {
    const betData = {
      marketId: 1,
      amount: 100,
      outcome: 'yes'
    }

    const createdBet = {
      id: 123,
      username: 'testuser',
      marketId: 1,
      amount: 100,
      outcome: 'yes',
      placedAt: '2025-10-07T14:30:00Z'
    }

    it('should place bet successfully', async () => {
      mock.onPost('/v0/bet', betData).reply(201, createdBet)

      const result = await bettingResource.placeBet(betData)

      expect(result).toEqual(createdBet)
      expect(mock.history.post).toHaveLength(1)
      expect(JSON.parse(mock.history.post[0].data)).toEqual(betData)
    })

    it('should validate required parameters', async () => {
      const invalidBetData = { marketId: 1 }

      await expect(bettingResource.placeBet(invalidBetData)).rejects.toThrow(
        'Missing required parameters: amount, outcome'
      )
    })

    it('should validate bet amount is positive', async () => {
      const invalidBetData = { ...betData, amount: 0 }

      await expect(bettingResource.placeBet(invalidBetData)).rejects.toThrow(
        'Bet amount must be greater than 0'
      )

      const negativeBetData = { ...betData, amount: -50 }

      await expect(bettingResource.placeBet(negativeBetData)).rejects.toThrow(
        'Bet amount must be greater than 0'
      )
    })

    it('should handle bet placement error', async () => {
      mock.onPost('/v0/bet').reply(400, {
        error: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient account balance'
      })

      await expect(bettingResource.placeBet(betData)).rejects.toThrow(
        'Insufficient account balance'
      )
    })
  })

  describe('getUserPosition', () => {
    const mockPosition = {
      marketId: 1,
      positions: {
        yes: 50,
        no: 25
      },
      totalValue: 75
    }

    it('should get user position successfully', async () => {
      mock.onGet('/v0/userposition/1').reply(200, mockPosition)

      const result = await bettingResource.getUserPosition(1)

      expect(result).toEqual(mockPosition)
      expect(mock.history.get).toHaveLength(1)
      expect(mock.history.get[0].url).toBe('/v0/userposition/1')
    })

    it('should throw error for missing market ID', async () => {
      await expect(bettingResource.getUserPosition()).rejects.toThrow(
        'Market ID is required'
      )
    })

    it('should handle authentication error', async () => {
      mock.onGet('/v0/userposition/1').reply(401, {
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      })

      await expect(bettingResource.getUserPosition(1)).rejects.toThrow(
        'Authentication required'
      )
    })
  })

  describe('sellPosition', () => {
    const sellData = {
      marketId: 1,
      amount: 50,
      outcome: 'yes'
    }

    it('should sell position successfully', async () => {
      mock.onPost('/v0/sell', sellData).reply(200)

      await bettingResource.sellPosition(sellData)

      expect(mock.history.post).toHaveLength(1)
      expect(mock.history.post[0].url).toBe('/v0/sell')
      expect(JSON.parse(mock.history.post[0].data)).toEqual(sellData)
    })

    it('should validate required parameters', async () => {
      const invalidSellData = { marketId: 1 }

      await expect(
        bettingResource.sellPosition(invalidSellData)
      ).rejects.toThrow('Missing required parameters: amount, outcome')
    })

    it('should validate sell amount is positive', async () => {
      const invalidSellData = { ...sellData, amount: 0 }

      await expect(
        bettingResource.sellPosition(invalidSellData)
      ).rejects.toThrow('Sell amount must be greater than 0')

      const negativeSellData = { ...sellData, amount: -25 }

      await expect(
        bettingResource.sellPosition(negativeSellData)
      ).rejects.toThrow('Sell amount must be greater than 0')
    })

    it('should handle sell position error', async () => {
      mock.onPost('/v0/sell').reply(400, {
        error: 'INSUFFICIENT_POSITION',
        message: 'Insufficient position to sell'
      })

      await expect(bettingResource.sellPosition(sellData)).rejects.toThrow(
        'Insufficient position to sell'
      )
    })
  })
})
