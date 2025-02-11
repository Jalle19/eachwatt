import {
  CharacteristicsSensorData,
  CharacteristicsSensorPollFunction,
  emptyCharacteristicsSensorData,
  emptySensorData,
  PowerSensorData,
  PowerSensorPollFunction,
  ShellyCharacteristicsSensor,
  ShellySensor,
} from '../sensor'
import { Circuit } from '../circuit'
import { getDedupedResponseBody } from '../http/client'
import { Characteristics } from '../characteristics'
import { createLogger } from '../logger'

export enum ShellySensorType {
  Gen1 = 'gen1',
  Gen2PM = 'gen2-pm',
  Gen2EM = 'gen2-em',
  Gen2Light = 'gen2-light',
}

type Gen1MeterResult = {
  power: number
}

type Gen1StatusResult = {
  meters: Gen1MeterResult[]
}

type Gen2SwitchGetStatusResult = {
  apower: number
  voltage: number
  // Not all Gen2 PM devices expose current and power factor
  current?: number
  pf?: number
}

type Gen2EMGetStatusResult = {
  a_act_power: number
  a_aprt_power: number
  a_pf: number
  a_voltage: number
  a_freq: number
  b_act_power: number
  b_aprt_power: number
  b_pf: number
  b_voltage: number
  b_freq: number
  c_act_power: number
  c_aprt_power: number
  c_pf: number
  c_voltage: number
  c_freq: number
}

const logger = createLogger('sensor.shelly')

const getSensorDataUrl = (sensor: ShellySensor | ShellyCharacteristicsSensor): string => {
  const address = sensor.shelly.address
  const meter = sensor.shelly.meter

  // Request a different endpoint depending on what type of Shelly we're dealing with
  switch (sensor.shelly.type as ShellySensorType) {
    case ShellySensorType.Gen1:
      return `http://${address}/status`
    case ShellySensorType.Gen2PM:
      return `http://${address}/rpc/Switch.GetStatus?id=${meter}`
    case ShellySensorType.Gen2Light:
      return `http://${address}/rpc/Light.GetStatus?id=${meter}`
    case ShellySensorType.Gen2EM:
      return `http://${address}/rpc/EM.GetStatus?id=${meter}`
  }
}

const parseGen1Response = async (
  timestamp: number,
  circuit: Circuit,
  responseBody: string,
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor as ShellySensor
  const data = JSON.parse(responseBody) as unknown as Gen1StatusResult

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: data.meters[sensor.shelly.meter].power,
  }
}

const parseGen2PMResponse = async (
  timestamp: number,
  circuit: Circuit,
  responseBody: string,
): Promise<PowerSensorData> => {
  const data = JSON.parse(responseBody) as unknown as Gen2SwitchGetStatusResult

  // Not all Gen2 PM devices expose current and power factor
  let apparentPower = undefined
  let powerFactor = undefined

  if (data.pf !== undefined && data.current !== undefined) {
    powerFactor = data.pf
    apparentPower = data.voltage * data.current
  }

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: data.apower,
    apparentPower,
    powerFactor,
  }
}

const parseGen2EMResponse = async (
  timestamp: number,
  circuit: Circuit,
  responseBody: string,
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor as ShellySensor
  const data = JSON.parse(responseBody) as unknown as Gen2EMGetStatusResult

  let power = 0
  let apparentPower = 0
  let powerFactor = 0
  switch (sensor.shelly.phase) {
    case 'a':
      power = data.a_act_power
      apparentPower = data.a_aprt_power
      powerFactor = data.a_pf
      break
    case 'b':
      power = data.b_act_power
      apparentPower = data.b_aprt_power
      powerFactor = data.b_pf
      break
    case 'c':
      power = data.c_act_power
      apparentPower = data.c_aprt_power
      powerFactor = data.c_pf
      break
  }

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: power,
    apparentPower: apparentPower,
    powerFactor: powerFactor,
  }
}

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor as ShellySensor
  const url = getSensorDataUrl(sensor)

  try {
    const responseBody = await getDedupedResponseBody(timestamp, url)

    // Parse the response differently depending on what type of Shelly we're dealing with
    switch (sensor.shelly.type as ShellySensorType) {
      case ShellySensorType.Gen1:
        return await parseGen1Response(timestamp, circuit, responseBody)
      case ShellySensorType.Gen2PM:
      case ShellySensorType.Gen2Light:
        return await parseGen2PMResponse(timestamp, circuit, responseBody)
      case ShellySensorType.Gen2EM:
        return await parseGen2EMResponse(timestamp, circuit, responseBody)
    }
  } catch (e) {
    logger.error(e)
    return emptySensorData(timestamp, circuit)
  }
}

export const getCharacteristicsSensorData: CharacteristicsSensorPollFunction = async (
  timestamp: number,
  characteristics: Characteristics,
): Promise<CharacteristicsSensorData> => {
  const sensor = characteristics.sensor as ShellyCharacteristicsSensor
  const url = getSensorDataUrl(sensor)

  // Only support gen2-em sensors
  if (sensor.shelly.type !== ShellySensorType.Gen2EM) {
    throw new Error(`Shelly sensor type ${sensor.shelly.type} not supported as characteristics sensor`)
  }

  try {
    const result = await getDedupedResponseBody(timestamp, url)
    const data = JSON.parse(result) as unknown as Gen2EMGetStatusResult

    let voltage = 0
    let frequency = 0
    switch (sensor.shelly.phase) {
      case 'a':
        voltage = data.a_voltage
        frequency = data.a_freq
        break
      case 'b':
        voltage = data.b_voltage
        frequency = data.b_freq
        break
      case 'c':
        voltage = data.c_voltage
        frequency = data.c_freq
        break
    }

    return {
      timestamp: timestamp,
      characteristics: characteristics,
      voltage: voltage,
      frequency: frequency,
    }
  } catch (e) {
    logger.error(e)
    return emptyCharacteristicsSensorData(timestamp, characteristics)
  }
}
