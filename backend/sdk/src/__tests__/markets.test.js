import MockAdapter from 'axios-mock-adapter'
import { HttpClient } from '../http-client.js'
import { MarketsResource } from '../resources/markets.js'

describe('MarketsResource', () => {
  let httpClient
  let marketsResource
  let mock

  beforeEach(() => {
    httpClient = new HttpClient('http://localhost:8080')
    marketsResource = new MarketsResource(httpClient)
    mock = new MockAdapter(httpClient.client)
  })

  afterEach(() => {
    mock.restore()
  })

  const mockMarketResponse = {
    markets: [
      {
        market: {
          id: 1,
          questionTitle: 'Will it rain tomorrow?',
          description: 'Weather prediction',
          outcomeType: 'binary',
          resolutionDateTime: '2025-10-08T12:00:00Z',
          isResolved: false,
          initialProbability: 0.5,
          creatorUsername: 'weatherman'
        },
        creator: {
          username: 'weatherman',
          displayname: 'Weather Expert'
        },
        lastProbability: 0.65,
        numUsers: 25,
        totalVolume: 5000
      }
    ]
  }

  describe('list', () => {
    it('should fetch all markets', async () => {
      mock.onGet('/v0/markets').reply(200, mockMarketResponse)

      const result = await marketsResource.list()

      expect(result).toEqual(mockMarketResponse)
      expect(mock.history.get).toHaveLength(1)
      expect(mock.history.get[0].url).toBe('/v0/markets')
    })
  })

  describe('search', () => {
    it('should search markets with query', async () => {
      mock.onGet('/v0/markets/search').reply(200, mockMarketResponse)

      const result = await marketsResource.search('weather')

      expect(result).toEqual(mockMarketResponse)
      expect(mock.history.get).toHaveLength(1)
      expect(mock.history.get[0].params).toEqual({ q: 'weather' })
    })

    it('should throw error for empty query', async () => {
      await expect(marketsResource.search('')).rejects.toThrow(
        'Search query is required'
      )
    })

    it('should throw error for null query', async () => {
      await expect(marketsResource.search(null)).rejects.toThrow(
        'Search query is required'
      )
    })
  })

  describe('listActive', () => {
    it('should fetch active markets', async () => {
      mock.onGet('/v0/markets/active').reply(200, mockMarketResponse)

      const result = await marketsResource.listActive()

      expect(result).toEqual(mockMarketResponse)
      expect(mock.history.get[0].url).toBe('/v0/markets/active')
    })
  })

  describe('listClosed', () => {
    it('should fetch closed markets', async () => {
      mock.onGet('/v0/markets/closed').reply(200, mockMarketResponse)

      const result = await marketsResource.listClosed()

      expect(result).toEqual(mockMarketResponse)
      expect(mock.history.get[0].url).toBe('/v0/markets/closed')
    })
  })

  describe('listResolved', () => {
    it('should fetch resolved markets', async () => {
      mock.onGet('/v0/markets/resolved').reply(200, mockMarketResponse)

      const result = await marketsResource.listResolved()

      expect(result).toEqual(mockMarketResponse)
      expect(mock.history.get[0].url).toBe('/v0/markets/resolved')
    })
  })

  describe('get', () => {
    const mockMarket = {
      id: 1,
      questionTitle: 'Will it rain tomorrow?',
      description: 'Weather prediction',
      outcomeType: 'binary',
      resolutionDateTime: '2025-10-08T12:00:00Z',
      isResolved: false,
      initialProbability: 0.5,
      creatorUsername: 'weatherman'
    }

    it('should fetch market by ID', async () => {
      mock.onGet('/v0/markets/1').reply(200, mockMarket)

      const result = await marketsResource.get(1)

      expect(result).toEqual(mockMarket)
      expect(mock.history.get[0].url).toBe('/v0/markets/1')
    })

    it('should throw error for missing market ID', async () => {
      await expect(marketsResource.get()).rejects.toThrow(
        'Market ID is required'
      )
    })
  })

  describe('projectProbability', () => {
    const projectionParams = {
      marketId: 1,
      amount: 100,
      outcome: 'yes'
    }

    const projectionResponse = {
      newProbability: 0.68
    }

    it('should project probability successfully', async () => {
      mock
        .onGet('/v0/marketprojection/1/100/yes/')
        .reply(200, projectionResponse)

      const result = await marketsResource.projectProbability(projectionParams)

      expect(result).toEqual(projectionResponse)
      expect(mock.history.get[0].url).toBe('/v0/marketprojection/1/100/yes/')
    })

    it('should validate required parameters', async () => {
      await expect(marketsResource.projectProbability({})).rejects.toThrow(
        'Missing required parameters: marketId, amount, outcome'
      )
    })
  })

  describe('getBets', () => {
    const mockBets = [
      {
        id: 1,
        username: 'trader1',
        marketId: 1,
        amount: 100,
        outcome: 'yes',
        placedAt: '2025-10-07T10:30:00Z'
      }
    ]

    it('should fetch market bets', async () => {
      mock.onGet('/v0/markets/bets/1').reply(200, mockBets)

      const result = await marketsResource.getBets(1)

      expect(result).toEqual(mockBets)
      expect(mock.history.get[0].url).toBe('/v0/markets/bets/1')
    })

    it('should throw error for missing market ID', async () => {
      await expect(marketsResource.getBets()).rejects.toThrow(
        'Market ID is required'
      )
    })
  })

  describe('getPositions', () => {
    it('should fetch market positions', async () => {
      const mockPositions = { positions: [] }
      mock.onGet('/v0/markets/positions/1').reply(200, mockPositions)

      const result = await marketsResource.getPositions(1)

      expect(result).toEqual(mockPositions)
      expect(mock.history.get[0].url).toBe('/v0/markets/positions/1')
    })
  })

  describe('getUserPositions', () => {
    it('should fetch user positions in market', async () => {
      const mockUserPositions = { userPositions: [] }
      mock
        .onGet('/v0/markets/positions/1/johndoe')
        .reply(200, mockUserPositions)

      const result = await marketsResource.getUserPositions(1, 'johndoe')

      expect(result).toEqual(mockUserPositions)
      expect(mock.history.get[0].url).toBe('/v0/markets/positions/1/johndoe')
    })

    it('should validate required parameters', async () => {
      await expect(marketsResource.getUserPositions()).rejects.toThrow(
        'Missing required parameters: marketId, username'
      )
    })
  })

  describe('getLeaderboard', () => {
    it('should fetch market leaderboard', async () => {
      const mockLeaderboard = { leaderboard: [] }
      mock.onGet('/v0/markets/leaderboard/1').reply(200, mockLeaderboard)

      const result = await marketsResource.getLeaderboard(1)

      expect(result).toEqual(mockLeaderboard)
      expect(mock.history.get[0].url).toBe('/v0/markets/leaderboard/1')
    })
  })

  describe('create', () => {
    const marketData = {
      questionTitle: 'Will it snow next week?',
      description: 'Weather prediction',
      outcomeType: 'binary',
      resolutionDateTime: '2025-10-15T12:00:00Z',
      initialProbability: 0.3
    }

    const createdMarket = {
      id: 2,
      ...marketData,
      isResolved: false,
      creatorUsername: 'testuser'
    }

    it('should create market successfully', async () => {
      mock.onPost('/v0/create', marketData).reply(201, createdMarket)

      const result = await marketsResource.create(marketData)

      expect(result).toEqual(createdMarket)
      expect(mock.history.post).toHaveLength(1)
      expect(JSON.parse(mock.history.post[0].data)).toEqual(marketData)
    })

    it('should validate required parameters', async () => {
      const incompleteData = { questionTitle: 'Test' }

      await expect(marketsResource.create(incompleteData)).rejects.toThrow(
        'Missing required parameters: description, outcomeType, resolutionDateTime'
      )
    })

    it('should format Date object to ISO string', async () => {
      const dataWithDate = {
        ...marketData,
        resolutionDateTime: new Date('2025-10-15T12:00:00Z')
      }

      const expectedData = {
        ...marketData,
        resolutionDateTime: '2025-10-15T12:00:00.000Z'
      }

      mock.onPost('/v0/create', expectedData).reply(201, createdMarket)

      await marketsResource.create(dataWithDate)

      expect(JSON.parse(mock.history.post[0].data)).toEqual(expectedData)
    })
  })

  describe('resolve', () => {
    it('should resolve market successfully', async () => {
      mock.onPost('/v0/resolve/1', { resolutionResult: 'yes' }).reply(200)

      await marketsResource.resolve(1, 'yes')

      expect(mock.history.post).toHaveLength(1)
      expect(mock.history.post[0].url).toBe('/v0/resolve/1')
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        resolutionResult: 'yes'
      })
    })

    it('should validate required parameters', async () => {
      await expect(marketsResource.resolve()).rejects.toThrow(
        'Missing required parameters: marketId, resolutionResult'
      )
    })
  })
})
