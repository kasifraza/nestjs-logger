import { StructuredLogger } from './logger.service';
import { CorrelationIdMiddleware, asyncLocalStorage, getCorrelationId } from './correlation';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let output: string[];

  beforeEach(() => {
    logger = new StructuredLogger({ level: 'debug', pretty: false });
    output = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((msg: any) => { output.push(msg); return true; });
    jest.spyOn(process.stderr, 'write').mockImplementation((msg: any) => { output.push(msg); return true; });
  });

  afterEach(() => jest.restoreAllMocks());

  it('outputs JSON with timestamp, level, message', () => {
    logger.log('hello');
    const parsed = JSON.parse(output[0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.timestamp).toBeDefined();
  });

  it('respects log level filtering', () => {
    const warnLogger = new StructuredLogger({ level: 'warn', pretty: false });
    warnLogger.log('should not appear');
    warnLogger.warn('should appear');
    expect(output).toHaveLength(1);
    expect(JSON.parse(output[0]).level).toBe('warn');
  });

  it('writes errors to stderr', () => {
    logger.error('fail', 'stack trace');
    const parsed = JSON.parse(output[0]);
    expect(parsed.level).toBe('error');
    expect(parsed.trace).toBe('stack trace');
  });

  it('includes context', () => {
    const ctxLogger = new StructuredLogger({ level: 'info', pretty: false, context: 'UserService' });
    ctxLogger.log('test');
    expect(JSON.parse(output[0]).context).toBe('UserService');
  });

  it('attaches correlationId from AsyncLocalStorage', (done) => {
    asyncLocalStorage.run({ correlationId: 'abc-123', requestId: 'req-1', method: 'GET', path: '/', startTime: Date.now() }, () => {
      logger.log('inside context');
      const parsed = JSON.parse(output[0]);
      expect(parsed.correlationId).toBe('abc-123');
      done();
    });
  });
});

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();

  it('generates correlationId if not in headers', (done) => {
    const req = { headers: {}, method: 'GET', originalUrl: '/test' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, () => {
      expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(getCorrelationId()).not.toBe('no-context');
      done();
    });
  });

  it('uses existing x-correlation-id from headers', (done) => {
    const req = { headers: { 'x-correlation-id': 'existing-id' }, method: 'POST', originalUrl: '/api' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, () => {
      expect(getCorrelationId()).toBe('existing-id');
      done();
    });
  });
});
