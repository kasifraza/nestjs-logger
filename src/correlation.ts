import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  userId?: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function getCorrelationId(): string {
  return asyncLocalStorage.getStore()?.correlationId || 'no-context';
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    const context: RequestContext = {
      correlationId,
      requestId: randomUUID(),
      method: req.method,
      path: req.originalUrl || req.url,
      startTime: Date.now(),
      userId: req.user?.id,
    };

    res.setHeader('x-correlation-id', correlationId);

    asyncLocalStorage.run(context, () => next());
  }
}
