import {
  emptySensorData,
  ModbusSensor,
  ModbusSensorSettings,
  PowerSensorData,
  PowerSensorPollFunction,
} from '../sensor'
import { Circuit } from '../circuit'
import { ReadRegisterResult } from 'modbus-serial/ModbusRTU'
import { createLogger } from '../logger'
import { getClient, requestTimeout } from '../modbus/client'

const logger = createLogger('sensor.modbus')

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor as ModbusSensor
  const sensorSettings = sensor.modbus

  const client = getClient(sensorSettings.address)

  try {
    // Connect if not connected yet
    if (!client.isOpen) {
      logger.info(`Connecting to ${sensorSettings.address}:${sensorSettings.port}...`)
      await client.connectTCP(sensorSettings.address, {
        port: sensorSettings.port,
        // Connect timeout (probably)
        timeout: requestTimeout,
      })
      client.setID(sensorSettings.unit)
      // Request timeout
      client.setTimeout(requestTimeout)
    }

    // Read the register and parse it accordingly
    const readRegisterResult = await client.readHoldingRegisters(sensorSettings.register, 1)

    return {
      timestamp,
      circuit,
      power: parseReadRegisterResult(readRegisterResult, sensorSettings),
    }
  } catch (e) {
    logger.error(e)

    return emptySensorData(timestamp, circuit)
  }
}

export const parseReadRegisterResult = (result: ReadRegisterResult, sensorSettings: ModbusSensorSettings): number => {
  switch (sensorSettings.type) {
    case 'int16':
    default:
      return result.buffer.readInt16BE()
  }
}
