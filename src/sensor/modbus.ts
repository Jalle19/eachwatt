import { emptySensorData, ModbusSensor, PowerSensorData, PowerSensorPollFunction } from '../sensor'
import { Circuit } from '../circuit'
import { ReadRegisterResult } from 'modbus-serial/ModbusRTU'
import { createLogger } from '../logger'
import { getClient, requestTimeout } from '../modbus/client'
import { getRegisterLength, ModbusRegister, stringify } from '../modbus/register'

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
    const register = sensorSettings.register as ModbusRegister
    logger.debug(`Reading holding register ${stringify(register)}`)
    const address = register.address
    const length = getRegisterLength(register)
    const readRegisterResult = await client.readHoldingRegisters(address, length)

    return {
      timestamp,
      circuit,
      power: parseReadRegisterResult(readRegisterResult, register),
    }
  } catch (e) {
    logger.error(e)

    return emptySensorData(timestamp, circuit)
  }
}

const parseReadRegisterResult = (result: ReadRegisterResult, register: ModbusRegister): number => {
  switch (register.dataType) {
    case 'float':
      return result.buffer.readFloatBE()
    case 'uint32':
      return result.buffer.readUint32BE()
    case 'int32':
      return result.buffer.readInt32BE()
    case 'uint16':
      return result.buffer.readUint16BE()
    case 'int16':
    case 'boolean':
    default:
      // Convert to number
      return (result as ReadCoilResult).data[0] ? 1 : 0
  }
}
