import { Sensor, SensorData } from './sensor'
import { Characteristics, CharacteristicsSensorData } from './characteristics'

export enum CircuitType {
  Main = 'main',
  Circuit = 'circuit',
}

export interface Circuit {
  name: string
  type: CircuitType // resolved
  parent: string | Circuit | undefined // resolved to the circuit in question
  children: Circuit[] // resolved from parent
  sensor: Sensor
  group?: string
}

export interface Main extends Circuit {
  phase: string
}

export const pollCircuits = async (
  timestamp: number,
  circuits: Circuit[],
  existingSensorData?: SensorData[],
): Promise<SensorData[]> => {
  const promises = []

  for (const circuit of circuits) {
    const sensor = circuit.sensor

    console.log(`Polling sensor ${sensor.type} of circuit ${circuit.name}`)
    promises.push(sensor.pollFunc(timestamp, circuit, existingSensorData))
  }

  return await Promise.all(promises)
}

export const pollCharacteristicsSensors = async (
  timestamp: number,
  characteristics: Characteristics[],
): Promise<CharacteristicsSensorData[]> => {
  const promises = []

  for (const c of characteristics) {
    const sensor = c.sensor

    console.log(`Polling sensor ${sensor.type} of characteristics ${c.name}`)
    promises.push(sensor.pollFunc(timestamp, c))
  }

  return await Promise.all(promises)
}

export const resolvePhase = (circuit: Circuit): string | null => {
  if (circuit.type === CircuitType.Main) {
    return (circuit as Main).phase
  } else if (typeof circuit.parent === 'object') {
    return resolvePhase(circuit.parent)
  } else {
    return null
  }
}
