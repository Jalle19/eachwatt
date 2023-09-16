import { emptySensorData, SensorData, SensorPollFunction, ShellySensor } from './sensor'
import { Circuit } from './circuit'
import { getDedupedResponse } from './http'

type MeterResult = {
  power: number
}

type StatusResult = {
  meters: MeterResult[]
}

const getSensorDataUrl = (sensor: ShellySensor): string => {
  const address = sensor.shelly.address

  return `http://${address}/status`
}

export const getSensorData: SensorPollFunction = async (timestamp: number, circuit: Circuit): Promise<SensorData> => {
  const sensor = circuit.sensor as ShellySensor
  const url = getSensorDataUrl(sensor)

  try {
    const result = await getDedupedResponse(timestamp, url)
    const data = result.data as StatusResult

    return {
      timestamp: timestamp,
      circuit: circuit,
      watts: data.meters[sensor.shelly.meter].power,
      unmeteredWatts: 0,
    }
  } catch (e) {
    console.error((e as Error).message)
    return emptySensorData(timestamp, circuit)
  }
}
