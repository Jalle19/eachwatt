import { Circuit } from './circuit'
import { Characteristics } from './characteristics'

export enum SensorType {
  Iotawatt = 'iotawatt',
  Shelly = 'shelly',
  Virtual = 'virtual',
  Unmetered = 'unmetered',
  Dummy = 'dummy',
}

export enum ShellyType {
  Gen1 = 'gen1',
  Gen2PM = 'gen2-pm',
  Gen2EM = 'gen2-em',
}

export enum CharacteristicsSensorType {
  Iotawatt = 'iotawatt',
  Shelly = 'shelly',
}

export type PowerSensorPollFunction = (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: PowerSensorData[],
) => Promise<PowerSensorData>

export type CharacteristicsSensorPollFunction = (
  timestamp: number,
  characteristics: Characteristics,
) => Promise<CharacteristicsSensorData>

export interface PowerSensor {
  type: SensorType
  pollFunc: PowerSensorPollFunction
}

export interface CharacteristicsSensor {
  type: CharacteristicsSensorType
  pollFunc: CharacteristicsSensorPollFunction
}

export interface IotawattCharacteristicsSensor extends CharacteristicsSensor {
  type: CharacteristicsSensorType.Iotawatt
  iotawatt: IotawattSensorSettings
}

interface ShellySensorSettings {
  address: string
  type?: ShellyType
  // For Gen1 devices and Gen2 devices implementing the "Switch" component
  meter: number
  // For devices implementing the "EM" component
  phase?: string
}

export interface ShellySensor extends PowerSensor {
  type: SensorType.Shelly
  shelly: ShellySensorSettings
}

export interface ShellyCharacteristicsSensor extends CharacteristicsSensor {
  type: CharacteristicsSensorType.Shelly
  shelly: ShellySensorSettings
}

interface IotawattSensorSettings {
  address: string
  name: string
}

export interface IotawattSensor extends PowerSensor {
  type: SensorType.Iotawatt
  iotawatt: IotawattSensorSettings
}

interface VirtualSensorSettings {
  children: (string | Circuit)[] // resolved to circuit at runtime
}

export interface VirtualSensor extends PowerSensor {
  type: SensorType.Virtual
  virtual: VirtualSensorSettings
}

interface UnmeteredSensorSettings {
  parent: string | Circuit // resolved to Circuit at runtime
  children: (string | Circuit)[] // resolved to Circuit at runtime
}

export interface UnmeteredSensor extends PowerSensor {
  type: SensorType.Unmetered
  unmetered: UnmeteredSensorSettings
}

export interface PowerSensorData {
  timestamp: number
  circuit: Circuit
  watts: number
}

export type CharacteristicsSensorData = {
  timestamp: number
  characteristics: Characteristics
  voltage: number
  frequency: number
}

export const emptySensorData = (timestamp: number, circuit: Circuit): PowerSensorData => {
  return {
    timestamp,
    circuit,
    watts: 0,
  }
}

export const emptyCharacteristicsSensorData = (
  timestamp: number,
  characteristics: Characteristics,
): CharacteristicsSensorData => {
  return {
    timestamp: timestamp,
    characteristics: characteristics,
    voltage: 0,
    frequency: 0,
  }
}

export const reduceToWatts = (sensorData: PowerSensorData[]): number => {
  return sensorData.reduce((acc, data) => acc + data.watts, 0)
}

export const untangleCircularDeps = (sensorData: PowerSensorData[]): PowerSensorData[] => {
  return sensorData.map((d) => {
    d.circuit.children = []
    return d
  })
}
