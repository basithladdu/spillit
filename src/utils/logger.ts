/**
 * Production-grade logging utility
 * Logs to console in dev, sends to backend in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createEntry(
    level: LogLevel,
    message: string,
    data?: any,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private logToConsole(entry: LogEntry) {
    const styles = {
      debug: 'color: #999; font-style: italic;',
      info: 'color: #0066cc;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
    };

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    console.log(`%c${prefix} ${entry.message}`, styles[entry.level], entry.data || '');

    if (entry.error) {
      console.error(entry.error);
    }
  }

  private storeLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private async sendToBackend(entry: LogEntry) {
    if (this.isDevelopment) return;

    try {
      // Send critical errors to backend for monitoring
      if (entry.level === 'error') {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Silently fail if backend is down
        });
      }
    } catch {
      // Don't throw if logging fails
    }
  }

  debug(message: string, data?: any) {
    const entry = this.createEntry('debug', message, data);
    this.logToConsole(entry);
    this.storeLog(entry);
  }

  info(message: string, data?: any) {
    const entry = this.createEntry('info', message, data);
    this.logToConsole(entry);
    this.storeLog(entry);
  }

  warn(message: string, data?: any) {
    const entry = this.createEntry('warn', message, data);
    this.logToConsole(entry);
    this.storeLog(entry);
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorInfo = error
      ? {
          message: error.message,
          stack: error.stack,
          code: error.code,
        }
      : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data,
      error: errorInfo,
    };

    this.logToConsole(entry);
    this.storeLog(entry);
    this.sendToBackend(entry);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

/**
 * Global error handler for unhandled promises
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason);
  });

  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error', event.error);
  });
}
