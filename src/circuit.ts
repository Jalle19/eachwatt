import { PowerSensor, PowerSensorData } from './sensor'
import { applyFilters } from './filter/filter'

export enum CircuitType {
  Main = 'main',
  Circuit = 'circuit',
}

export interface Circuit {
  name: string
  type?: CircuitType // resolved during parsing
  parent?: string | Circuit // resolved to the circuit in question
  children: Circuit[] // resolved from parent
  phase?: string // resolved from parent
  hidden?: boolean // defaults to false
  sensor: PowerSensor
  group?: string
}

export interface Main extends Circuit {
  phase: string
}

export const pollPowerSensors = async (
  timestamp: number,
  circuits: Circuit[],
  existingSensorData?: PowerSensorData[],
): Promise<PowerSensorData[]> => {
  const promises = []

  for (const circuit of circuits) {
    promises.push(pollPowerSensor(timestamp, circuit, existingSensorData))
  }

  return Promise.all(promises)
}

const pollPowerSensor = async (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: PowerSensorData[],
): Promise<PowerSensorData> => {
  const sensor = circuit.sensor

  let data = await sensor.pollFunc(timestamp, circuit, existingSensorData)

  if (sensor.filters) {
    data = applyFilters(sensor.filters, data)
  }

  return data
}
