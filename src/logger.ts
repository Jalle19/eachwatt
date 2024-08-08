import winston, { Logger } from 'winston'

export enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
}

// Define log transports here, so we can change the log level later
const transports = [new winston.transports.Console()]

const logFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
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
