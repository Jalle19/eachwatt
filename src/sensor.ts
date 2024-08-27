import { Circuit } from './circuit'
import { Characteristics } from './characteristics'
import { PowerSensorFilters } from './filter/filter'
import { ModbusRegister } from './modbus/register'

export enum SensorType {
  Iotawatt = 'iotawatt',
  Shelly = 'shelly',
  Modbus = 'modbus',
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
  Dummy = 'dummy',
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
  filters?: PowerSensorFilters
}

export interface CharacteristicsSensor {
  type: CharacteristicsSensorType
  pollFunc: CharacteristicsSensorPollFunction
}

export interface IotawattCharacteristicsSensor extends CharacteristicsSensor {
  type: CharacteristicsSensorType.Iotawatt
  iotawatt: IotawattSensorSettings
}

export type ShellySensorSettings = {
  address: string
  type?: ShellyType
  // Mandatory for all devices
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

export interface ModbusSensorSettings {
  address: string
  port: number
  unit: number
  register: string | ModbusRegister
}

export interface ModbusSensor extends PowerSensor {
  type: SensorType.Modbus
  modbus: ModbusSensorSettings
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
  // Mandatory data. Undefined means the data was not available.
  power?: number
  // Optional data, not all sensor types support them
  apparentPower?: number
  powerFactor?: number
}

export type CharacteristicsSensorData = {
  timestamp: number
  characteristics: Characteristics
  // Mandatory data. Undefined means the data was not available.
  voltage?: number
  frequency?: number
}

export const emptySensorData = (timestamp: number, circuit: Circuit): PowerSensorData => {
  return {
    timestamp,
    circuit,
  }
}

export const emptyCharacteristicsSensorData = (
  timestamp: number,
  characteristics: Characteristics,
): CharacteristicsSensorData => {
  return {
    timestamp: timestamp,
    characteristics: characteristics,
  }
}

export const reduceToWatts = (sensorData: PowerSensorData[]): number => {
  return sensorData.reduce((acc, data) => acc + (data.power ?? 0), 0)
}

export const untangleCircularDeps = (sensorData: PowerSensorData[]): PowerSensorData[] => {
  return sensorData.map((d) => {
    d.circuit.children = []
    return d
  })
}

const isShellyGen2EMSensor = (sensor: PowerSensor): boolean => {
  return sensor.type === SensorType.Shelly && (sensor as ShellySensor).shelly.type === ShellyType.Gen2EM
}

export const supportsApparentPower = (sensor: PowerSensor): boolean => {
  // Only EM devices supports this
  return isShellyGen2EMSensor(sensor)
}

export const supportsPowerFactor = (sensor: PowerSensor): boolean => {
  // IotaWatt sensors support power factor too, but only for inputs, not outputs
  return isShellyGen2EMSensor(sensor)
}
