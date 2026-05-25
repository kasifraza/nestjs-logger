import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { getRequestContext } from './correlation';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface LoggerOptions {
  level?: LogLevel;
  pretty?: boolean;
  context?: string;
}

@Injectable()
export class StructuredLogger implements NestLoggerService {
  private level: LogLevel;
  private pretty: boolean;
  private context?: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.pretty = options.pretty ?? process.env.NODE_ENV !== 'production';
    this.context = options.context;
  }

  log(message: string, context?: string) { this.write('info', message, context); }
  warn(message: string, context?: string) { this.write('warn', message, context); }
  error(message: string, trace?: string, context?: string) { this.write('error', message, context, { trace }); }
  debug(message: string, context?: string) { this.write('debug', message, context); }
  verbose(message: string, context?: string) { this.write('debug', message, context); }

  private write(level: LogLevel, message: string, context?: string, extra?: Record<string, any>) {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.level]) return;

    const reqCtx = getRequestContext();
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || this.context,
      correlationId: reqCtx?.correlationId,
      requestId: reqCtx?.requestId,
      ...extra,
    };

    const output = this.pretty ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);

    if (level === 'error') process.stderr.write(output + '\n');
    else process.stdout.write(output + '\n');
  }
}
