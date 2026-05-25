# @kasifraza/nestjs-logger

[![npm package](https://img.shields.io/npm/v/@kasifraza/nestjs-logger?color=brightgreen&label=npm%20package)](https://www.npmjs.com/package/@kasifraza/nestjs-logger)
[![license](https://img.shields.io/npm/l/@kasifraza/nestjs-logger)](https://github.com/kasifraza/nestjs-logger/blob/main/LICENSE)
[![downloads](https://img.shields.io/npm/dw/@kasifraza/nestjs-logger?color=brightgreen)](https://www.npmjs.com/package/@kasifraza/nestjs-logger)

Structured JSON logger for NestJS with request tracing, correlation IDs, and per-module log levels. Zero dependencies beyond NestJS.

## Install

```bash
npm install @kasifraza/nestjs-logger
```

## Setup

```ts
// main.ts
import { StructuredLogger, LoggingInterceptor } from '@kasifraza/nestjs-logger';

const app = await NestFactory.create(AppModule, { logger: new StructuredLogger() });
app.useGlobalInterceptors(new LoggingInterceptor());
```

```ts
// app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { CorrelationIdMiddleware } from '@kasifraza/nestjs-logger';

@Module({})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
```

## Features

- **Structured JSON output** — machine-parseable logs for CloudWatch/ELK/Datadog
- **Correlation IDs** — auto-generated or passed via `x-correlation-id` header
- **Request tracing** — method, path, status code, duration auto-logged
- **Log levels** — `debug`, `info`, `warn`, `error` with filtering
- **AsyncLocalStorage** — correlation ID available anywhere without passing through params
- **Zero config** — works out of the box, configurable when needed

## Log Output

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "← GET /users 200 12ms",
  "context": "HTTP",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

## API

### `StructuredLogger`

```ts
const logger = new StructuredLogger({
  level: 'info',      // 'debug' | 'info' | 'warn' | 'error'
  pretty: false,      // pretty-print JSON (auto: true in dev)
  context: 'MyService'
});

logger.log('message');
logger.warn('message');
logger.error('message', 'stack trace');
logger.debug('message');
```

### `CorrelationIdMiddleware`

Attaches correlation ID to every request via `AsyncLocalStorage`. Reads from `x-correlation-id` header or generates a new UUID.

### `LoggingInterceptor`

Auto-logs incoming requests and outgoing responses with duration.

### `getCorrelationId()`

Get the current correlation ID from anywhere:

```ts
import { getCorrelationId } from '@kasifraza/nestjs-logger';

const id = getCorrelationId(); // works in services, repositories, etc.
```

### `getRequestContext()`

Get full request context:

```ts
import { getRequestContext } from '@kasifraza/nestjs-logger';

const ctx = getRequestContext();
// { correlationId, requestId, method, path, startTime, userId }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Minimum log level |
| `NODE_ENV` | — | When `production`, disables pretty-print |

## License

MIT
