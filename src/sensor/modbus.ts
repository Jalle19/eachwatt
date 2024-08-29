import { emptySensorData, ModbusSensor, PowerSensorData, PowerSensorPollFunction } from '../sensor'
import { Circuit } from '../circuit'
import { ReadCoilResult, ReadRegisterResult } from 'modbus-serial/ModbusRTU'
import { createLogger } from '../logger'
import { getClient, requestTimeout } from '../modbus/client'
import { getRegisterLength, ModbusRegister, RegisterType, stringify } from '../modbus/register'
import ModbusRTU from 'modbus-serial'

export const DEFAULT_PORT = 502
export const DEFAULT_UNIT = 1

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
    const readRegisterResult = await readRegisters(client, register)

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

const readRegisters = async (
  client: ModbusRTU,
  register: ModbusRegister,
): Promise<ReadRegisterResult | ReadCoilResult> => {
  logger.debug(`Reading register/coil ${stringify(register)}`)
  const address = register.address
  const length = getRegisterLength(register)

  switch (register.registerType) {
    case RegisterType.HOLDING_REGISTER:
      return await client.readHoldingRegisters(address, length)
    case RegisterType.INPUT_REGISTER:
      return await client.readInputRegisters(address, length)
    case RegisterType.COIL:
      return await client.readCoils(address, length)
    case RegisterType.DISCRETE_INPUT:
      return await client.readDiscreteInputs(address, length)
  }
}

const parseReadRegisterResult = (result: ReadRegisterResult | ReadCoilResult, register: ModbusRegister): number => {
  switch (register.dataType) {
    case 'float':
      // Assume mixed-endian encoding is used
      return result.buffer.swap16().readFloatLE()
    case 'uint32':
      return result.buffer.readUint32BE()
    case 'int32':
      return result.buffer.readInt32BE()
    case 'uint16':
      return result.buffer.readUint16BE()
    case 'boolean':
      // Convert to number
      return (result as ReadCoilResult).data[0] ? 1 : 0
    case 'int16':
    default:
      return result.buffer.readInt16BE()
  }
}
