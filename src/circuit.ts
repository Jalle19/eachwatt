import { PowerSensor, PowerSensorData } from './sensor'

export enum CircuitType {
  Main = 'main',
  Circuit = 'circuit',
}

export interface Circuit {
  name: string
  type: undefined | CircuitType // resolved
  parent: string | Circuit | undefined // resolved to the circuit in question
  children: Circuit[] // resolved from parent
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
