import { PowerSensor, PowerSensorData } from './sensor'

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
    const sensor = circuit.sensor

    promises.push(sensor.pollFunc(timestamp, circuit, existingSensorData))
  }

  return Promise.all(promises)
}
