import { emptySensorData, IotawattSensor, SensorData, SensorPollFunction } from './sensor'
import { Circuit } from './circuit'
import { getDedupedResponse } from './http'

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
}

type IotawattStatusOutput = {
  name: string
  value: number
}

type IotawattStatus = {
  inputs: IotawattStatusInput[]
  outputs: IotawattStatusOutput[]
}

const getConfigurationUrl = (sensor: IotawattSensor): string => {
  return `http://${sensor.iotawatt.address}/config.txt`
}

const getStatusUrl = (sensor: IotawattSensor): string => {
  return `http://${sensor.iotawatt.address}/status?state=&inputs=&outputs=`
}

const getSensorValue = (
  sensor: IotawattSensor,
  configuration: IotawattConfiguration,
  status: IotawattStatus,
): number => {
  // Check inputs first if we find a match
  for (let i = 0; i < configuration.inputs.length; i++) {
    const input = configuration.inputs[i]
    if (input.name === sensor.iotawatt.name) {
      const watts = status.inputs[i].Watts

      // Can be " 0" or "423"...
      return parseInt(watts.trim(), 10)
    }
  }

  // Check outputs
  for (const output of status.outputs) {
    if (output.name === sensor.iotawatt.name) {
      return output.value
    }
  }

  throw new Error(`Failed to find value for sensor ${sensor.iotawatt.name}`)
}

export const getSensorData: SensorPollFunction = async (timestamp: number, circuit: Circuit): Promise<SensorData> => {
  const sensor = circuit.sensor as IotawattSensor

  try {
    const configurationResult = await getDedupedResponse(timestamp, getConfigurationUrl(sensor))
    const configuration = configurationResult.data as IotawattConfiguration
    const statusResult = await getDedupedResponse(timestamp, getStatusUrl(sensor))
    const status = statusResult.data as IotawattStatus

    return {
      timestamp: timestamp,
      circuit: circuit,
      watts: getSensorValue(sensor, configuration, status),
    }
  } catch (e) {
    console.error((e as Error).message)
    return emptySensorData(timestamp, circuit)
  }
}
