// src/utils/logger.ts
interface LogContext {
  [key: string]: any;
}

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private logLevel: string = 'info';
  private timestamp: boolean = true;

  private shouldLog(level: LogLevel): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentIndex = levels.indexOf(this.logLevel.toUpperCase());
    const logIndex = levels.indexOf(level);
    return logIndex >= currentIndex;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.timestamp ? `[${this.formatTimestamp()}]` : '';
    const levelStr = `[${level}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${timestamp} ${levelStr} ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatLog(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLog(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      let errorInfo = '';
      if (error instanceof Error) {
        errorInfo = ` | Error: ${error.message}`;
      } else if (error) {
        errorInfo = ` | Error: ${JSON.stringify(error)}`;
      }
      console.error(this.formatLog(LogLevel.ERROR, message, context) + errorInfo);
    }
  }
}

export const logger = new Logger();
