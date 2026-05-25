import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StructuredLogger } from './logger.service';
import { getRequestContext } from './correlation';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new StructuredLogger({ context: 'HTTP' });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;

    this.logger.log(`→ ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const reqCtx = getRequestContext();
          const duration = reqCtx ? Date.now() - reqCtx.startTime : 0;
          this.logger.log(`← ${method} ${url} ${res.statusCode} ${duration}ms`);
        },
        error: (err) => {
          const reqCtx = getRequestContext();
          const duration = reqCtx ? Date.now() - reqCtx.startTime : 0;
          this.logger.error(`✗ ${method} ${url} ${err.status || 500} ${duration}ms - ${err.message}`);
        },
      }),
    );
  }
}
