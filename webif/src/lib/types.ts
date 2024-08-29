export enum SensorType {
  Iotawatt = 'iotawatt',
  Shelly = 'shelly',
  Virtual = 'virtual',
  Unmetered = 'unmetered',
  Dummy = 'dummy',
}

export interface PowerSensor {
  type: SensorType
}

export enum CircuitType {
  Main = 'main',
  Circuit = 'circuit',
}

export type Circuit = {
  name: string
  type: CircuitType // resolved during parsing
  parent?: Circuit // resolved to the circuit in question
  children: Circuit[] // resolved from parent
  phase?: string // resolved from parent
  hidden?: boolean // defaults to false
  sensor: PowerSensor
  group?: string
}

export interface SensorData {
  timestamp: number
}

export interface PowerSensorData extends SensorData {
  circuit: Circuit
  // Mandatory data. Undefined means the data was not available.
  power?: number
  // Optional data, not all sensor types support them
  apparentPower?: number
  powerFactor?: number
}

export interface CharacteristicsSensorData extends SensorData {
  characteristics: {
    name: string
    phase: string
  }
  // Mandatory data. Undefined means the data was not available.
  voltage?: number
  frequency?: number
}
