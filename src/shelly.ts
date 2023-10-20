import {
  CharacteristicsSensorData,
  CharacteristicsSensorPollFunction,
  emptyCharacteristicsSensorData,
  emptySensorData,
  PowerSensorData,
  PowerSensorPollFunction,
  ShellyCharacteristicsSensor,
  ShellySensor,
  ShellyType,
} from './sensor'
import { Circuit } from './circuit'
import { getDedupedResponse } from './http/client'
import { AxiosResponse } from 'axios'
import { Characteristics } from './characteristics'

type Gen1MeterResult = {
  power: number
}

type Gen1StatusResult = {
  meters: Gen1MeterResult[]
}

type Gen2SwitchGetStatusResult = {
  apower: number
}

type Gen2EMGetStatusResult = {
  a_act_power: number
  a_voltage: number
  a_freq: number
  b_act_power: number
  b_voltage: number
  b_freq: number
  c_act_power: number
  c_voltage: number
  c_freq: number
}

const getSensorDataUrl = (sensor: ShellySensor | ShellyCharacteristicsSensor): string => {
  const address = sensor.shelly.address
  const meter = sensor.shelly.meter

  // Request a different endpoint depending on what type of Shelly we're dealing with
  switch (sensor.shelly.type as ShellyType) {
    case ShellyType.Gen1:
      return `http://${address}/status`
    case ShellyType.Gen2PM:
      return `http://${address}/rpc/Switch.GetStatus?id=${meter}`
    case ShellyType.Gen2EM:
      return `http://${address}/rpc/EM.GetStatus?id=${meter}`
  }
}

const parseGen1Response = (timestamp: number, circuit: Circuit, httpResponse: AxiosResponse): PowerSensorData => {
  const sensor = circuit.sensor as ShellySensor
  const data = httpResponse.data as Gen1StatusResult

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: data.meters[sensor.shelly.meter].power,
  }
}

const parseGen2PMResponse = (timestamp: number, circuit: Circuit, httpResponse: AxiosResponse): PowerSensorData => {
  const data = httpResponse.data as Gen2SwitchGetStatusResult

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: data.apower,
  }
}

const parseGen2EMResponse = (timestamp: number, circuit: Circuit, httpResponse: AxiosResponse): PowerSensorData => {
  const sensor = circuit.sensor as ShellySensor
  const data = httpResponse.data as Gen2EMGetStatusResult

  let power = 0
  switch (sensor.shelly.phase) {
    case 'a':
      power = data.a_act_power
      break
    case 'b':
      power = data.b_act_power
      break
    case 'c':
      power = data.c_act_power
      break
  }

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: power,
  }
}

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor as ShellySensor
  const url = getSensorDataUrl(sensor)

  try {
    const httpResponse = await getDedupedResponse(timestamp, url)

    // Parse the response differently depending on what type of Shelly we're dealing with
    switch (sensor.shelly.type as ShellyType) {
      case ShellyType.Gen1:
        return parseGen1Response(timestamp, circuit, httpResponse)
      case ShellyType.Gen2PM:
        return parseGen2PMResponse(timestamp, circuit, httpResponse)
      case ShellyType.Gen2EM:
        return parseGen2EMResponse(timestamp, circuit, httpResponse)
    }
  } catch (e) {
    console.error((e as Error).message)
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
  if (sensor.shelly.type !== ShellyType.Gen2EM) {
    throw new Error(`Shelly sensor type ${sensor.shelly.type} not supported as characteristics sensor`)
  }

  try {
    const httpResponse = await getDedupedResponse(timestamp, url)
    const data = httpResponse.data as Gen2EMGetStatusResult

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
    console.error((e as Error).message)
    return emptyCharacteristicsSensorData(timestamp, characteristics)
  }
}
