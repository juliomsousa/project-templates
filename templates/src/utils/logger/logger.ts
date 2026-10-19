/* eslint-disable no-console -- the console sink is the only place allowed to write to the console */
import {env} from '@app/env'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogContext = Record<string, unknown>

/** A destination for logs: console in dev, the monitoring tool's adapter otherwise */
export interface LogSink {
  log: (level: LogLevel, message: string, context?: LogContext) => void
  /** Global context attached to every subsequent log (user id, session id, app version …) */
  setAttribute?: (key: string, value: unknown) => void
}

const LEVEL_ORDER: Record<LogLevel, number> = {debug: 0, info: 1, warn: 2, error: 3}

export const consoleSink: LogSink = {
  log: (level, message, context) => console[level](message, context ?? '')
}

let sinks: LogSink[] = __DEV__ ? [consoleSink] : []

/** Register the monitoring adapter (TODO(planning): Datadog, Sentry, Crashlytics …) */
export const addLogSink = (sink: LogSink) => {
  sinks = [...sinks, sink]
}

export const resetLogSinks = (next: LogSink[] = []) => {
  sinks = next
}

const write = (level: LogLevel, message: string, context?: LogContext) => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[env.LOG_LEVEL]) return
  sinks.forEach(sink => sink.log(level, message, context))
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
  setAttribute: (key: string, value: unknown) =>
    sinks.forEach(sink => sink.setAttribute?.(key, value))
}
