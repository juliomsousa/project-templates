import {addLogSink, logger, resetLogSinks, type LogSink} from './logger'

const createSink = (): jest.Mocked<Required<LogSink>> => ({
  log: jest.fn(),
  setAttribute: jest.fn()
})

describe('Given the logger', () => {
  beforeEach(() => resetLogSinks())

  describe('When a monitoring sink is registered', () => {
    it('should forward every log at or above the configured level', () => {
      const sink = createSink()
      addLogSink(sink)

      logger.error('Request failed', {status: 500})

      expect(sink.log).toHaveBeenCalledWith('error', 'Request failed', {
        status: 500
      })
    })

    it('should forward global attributes', () => {
      const sink = createSink()
      addLogSink(sink)

      logger.setAttribute('userId', 'user-1')

      expect(sink.setAttribute).toHaveBeenCalledWith('userId', 'user-1')
    })
  })

  describe('When no sink is registered', () => {
    it('should not throw', () => {
      expect(() => logger.warn('Nothing listens')).not.toThrow()
    })
  })
})
