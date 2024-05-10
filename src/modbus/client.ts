import { createLogger } from '../logger'
import ModbusRTU from 'modbus-serial'

const logger = createLogger('modbus')

// Request timeout configuration
export let requestTimeout = 5000

export const setRequestTimeout = (timeoutMs: number) => {
  requestTimeout = timeoutMs
  logger.info(`Using ${timeoutMs} millisecond timeout for Modbus operations`)
}

// Keep track of clients, use one per address
const clients = new Map<string, ModbusRTU>()

export const getClient = (address: string): ModbusRTU => {
  if (!clients.has(address)) {
    const client = new ModbusRTU()
    clients.set(address, client)
  }

  return clients.get(address) as ModbusRTU
}
