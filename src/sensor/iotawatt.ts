import {
  CharacteristicsSensorData,
  CharacteristicsSensorPollFunction,
  emptyCharacteristicsSensorData,
  emptySensorData,
  IotawattCharacteristicsSensor,
  IotawattSensor,
  PowerSensorData,
  PowerSensorPollFunction,
} from '../sensor'
import { Circuit } from '../circuit'
import { getDedupedResponse } from '../http/client'
import { Characteristics } from '../characteristics'

type IotawattConfigurationInput = {
  channel: number
  name: string
}

type IotawattConfigurationOutput = {
  name: string
}

type IotawattConfiguration = {
  inputs: IotawattConfigurationInput[]
  outputs: IotawattConfigurationOutput[]
}

type IotawattStatusInput = {
  channel: number
  Watts: string
  Pf?: number
}

type IotawattStatusOutput = {
  name: string
  value: number
}

type IotawattStatus = {
  inputs: IotawattStatusInput[]
  outputs: IotawattStatusOutput[]
}

type IotawattCharacteristicsQuery = number[][]

const getConfigurationUrl = (sensor: IotawattSensor): string => {
  return `http://${sensor.iotawatt.address}/config.txt`
}

const getStatusUrl = (sensor: IotawattSensor): string => {
  return `http://${sensor.iotawatt.address}/status?state=&inputs=&outputs=`
}

const parseInputWattValue = (watts: string): number => {
  // Can be " 0" or "423"...
  return parseInt(watts.trim(), 10)
}

const getSensorPowerValue = (
  sensor: IotawattSensor,
  configuration: IotawattConfiguration,
  status: IotawattStatus,
): number => {
  // Check inputs first if we find a match
  for (let i = 0; i < configuration.inputs.length; i++) {
    const input = configuration.inputs[i]
    if (input.name === sensor.iotawatt.name) {
      const watts = status.inputs[i].Watts

      return parseInputWattValue(watts)
    }
  }

  // Check outputs
  for (const output of status.outputs) {
    if (output.name === sensor.iotawatt.name) {
      return output.value
    }
  }

  throw new Error(`Failed to find power value for sensor ${sensor.iotawatt.name}`)
}

const getSensorPowerFactorValue = (
  sensor: IotawattSensor,
  configuration: IotawattConfiguration,
  status: IotawattStatus,
): number | undefined => {
  // Power factor is only available for inputs
  for (let i = 0; i < configuration.inputs.length; i++) {
    const input = configuration.inputs[i]
    if (input.name === sensor.iotawatt.name) {
      // The power factor value cannot be trusted for small loads, and apparently this is done client-side on the
      // IotaWatt web interface. Emulate the same logic here.
      const watts = parseInputWattValue(status.inputs[i].Watts)

      return watts >= 50 ? status.inputs[i].Pf : undefined
    }
  }

  // Return undefined if the sensor doesn't have a corresponding input, we don't
  // want to fail hard since the value is optional
  return undefined
}

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor as IotawattSensor

  try {
    const configurationResult = await getDedupedResponse(timestamp, getConfigurationUrl(sensor))
    const configuration = configurationResult.data as IotawattConfiguration
    const statusResult = await getDedupedResponse(timestamp, getStatusUrl(sensor))
    const status = statusResult.data as IotawattStatus

    return {
      timestamp: timestamp,
      circuit: circuit,
      power: getSensorPowerValue(sensor, configuration, status),
      powerFactor: getSensorPowerFactorValue(sensor, configuration, status),
    }
  } catch (e) {
    console.error((e as Error).message)
    return emptySensorData(timestamp, circuit)
  }
}

const getQueryUrl = (sensor: IotawattCharacteristicsSensor): string => {
  return `http://${sensor.iotawatt.address}/query?select=[${sensor.iotawatt.name}.volts,${sensor.iotawatt.name}.hz]&begin=s-10s&end=s&group=m`
}

export const getCharacteristicsSensorData: CharacteristicsSensorPollFunction = async (
  timestamp: number,
  characteristics: Characteristics,
): Promise<CharacteristicsSensorData> => {
  const sensor = characteristics.sensor as IotawattCharacteristicsSensor

  try {
    const queryResult = await getDedupedResponse(timestamp, getQueryUrl(sensor))
    const query = queryResult.data as IotawattCharacteristicsQuery

    return {
      timestamp: timestamp,
      characteristics: characteristics,
      voltage: query[0][0],
      frequency: query[0][1],
    }
  } catch (e) {
    console.error((e as Error).message)
    return emptyCharacteristicsSensorData(timestamp, characteristics)
  }
}
