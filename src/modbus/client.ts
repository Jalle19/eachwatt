import { createLogger } from '../logger'
import ModbusRTU from 'modbus-serial'

const logger = createLogger('modbus')

// Request timeout configuration
export let requestTimeout = 5000

export const setRequestTimeout = (timeoutMs: number) => {
  requestTimeout = timeoutMs
  logger.info(`Using ${timeoutMs} millisecond timeout for Modbus operations`)
}

// Keep track of clients, use one per address/port/unit combination
const clients = new Map<string, ModbusRTU>()

export const getClient = (address: string, port: number, unit: number): ModbusRTU => {
  const key = `${address}_${port}_${unit}`

  if (!clients.has(key)) {
    const client = new ModbusRTU()
    clients.set(key, client)
  }

  return clients.get(key) as ModbusRTU
}
