import { Circuit } from './circuit'

export enum SensorType {
  Iotawatt = 'iotawatt',
  Shelly = 'shelly',
  Virtual = 'virtual',
}

export type SensorPollFunction = (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: SensorData[],
) => Promise<SensorData>

export interface Sensor {
  type: SensorType
  pollFunc: SensorPollFunction
}

interface ShellySensorSettings {
  address: string
  meter: number
}

export interface ShellySensor extends Sensor {
  type: SensorType.Shelly
  shelly: ShellySensorSettings
}

interface IotawattSensorSettings {
  address: string
  name: string
}

export interface IotawattSensor extends Sensor {
  type: SensorType.Iotawatt
  iotawatt: IotawattSensorSettings
}

interface VirtualSensorSettings {
  meteredChildren: string[]
  unmeteredChildren: string[]
}

export interface VirtualSensor extends Sensor {
  type: SensorType.Virtual
  virtual: VirtualSensorSettings
}

export interface SensorData {
  timestamp: number
  circuit: Circuit
  watts: number
  unmeteredWatts: number // calculated
}

export const emptySensorData = (timestamp: number, circuit: Circuit): SensorData => {
  return {
    timestamp,
    circuit,
    watts: 0,
    unmeteredWatts: 0,
  }
}
