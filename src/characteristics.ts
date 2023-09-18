import { CharacteristicsSensor } from './sensor'

export type Characteristics = {
  name: string
  phase: string
  sensor: CharacteristicsSensor
}

export type CharacteristicsSensorData = {
  timestamp: number
  characteristics: Characteristics
  voltage: number
  frequency: number
}

export type CharacteristicsSensorPollFunction = (
  timestamp: number,
  characteristics: Characteristics,
) => Promise<CharacteristicsSensorData>

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
