import { emptySensorData, PowerSensorData, PowerSensorPollFunction, ShellySensor, ShellyType } from './sensor'
import { Circuit } from './circuit'
import { getDedupedResponse } from './http/client'
import { AxiosResponse } from 'axios'

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
  b_act_power: number
  c_act_power: number
}

const getSensorDataUrl = (sensor: ShellySensor): string => {
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
    watts: data.meters[sensor.shelly.meter].power,
  }
}

const parseGen2PMResponse = (timestamp: number, circuit: Circuit, httpResponse: AxiosResponse): PowerSensorData => {
  const data = httpResponse.data as Gen2SwitchGetStatusResult

  return {
    timestamp: timestamp,
    circuit: circuit,
    watts: data.apower,
  }
}

const parseGen2EMResponse = (timestamp: number, circuit: Circuit, httpResponse: AxiosResponse): PowerSensorData => {
  const sensor = circuit.sensor as ShellySensor
  const data = httpResponse.data as Gen2EMGetStatusResult

  let watts = 0
  switch (sensor.shelly.phase) {
    case 'a':
      watts = data.a_act_power
      break
    case 'b':
      watts = data.b_act_power
      break
    case 'c':
      watts = data.c_act_power
      break
  }

  return {
    timestamp: timestamp,
    circuit: circuit,
    watts: watts,
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
