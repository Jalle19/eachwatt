import winston, { Logger } from 'winston'

export enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
}

// Define log transports here, so we can change the log level later
const transports = [new winston.transports.Console()]

const logFormat = winston.format.printf(({ level, message, label, timestamp, stack }) => {
  // Stack should be either an empty string (for non-errors) or
  // the original value minus the first line (which is not part of the
  // trace itself)

  if (stack !== undefined) {
    const st = stack as string
    stack = st.substring(st.indexOf('\n'))
  } else {
    stack = ''
  }

  return `${timestamp as string} [${label as string}] ${level}: ${message as string} ${stack as string}`
})

export const setLogLevel = (level: LogLevel) => {
  transports[0].level = level
}

export const createLogger = (module: string): Logger => {
  return winston.createLogger({
    'level': LogLevel.INFO,
    'format': winston.format.combine(winston.format.label({ label: module }), winston.format.timestamp(), logFormat),
    'transports': transports,
  })
}
