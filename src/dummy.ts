import {
  CharacteristicsSensorData,
  CharacteristicsSensorPollFunction,
  emptyCharacteristicsSensorData,
  emptySensorData,
  PowerSensorData,
  PowerSensorPollFunction,
} from './sensor'
import { Circuit } from './circuit'
import { Characteristics } from './characteristics'

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  existingSensorData?: PowerSensorData[],
): Promise<PowerSensorData> => {
  return emptySensorData(timestamp, circuit)
}

export const getCharacteristicsSensorData: CharacteristicsSensorPollFunction = async (
  timestamp: number,
  characteristics: Characteristics,
): Promise<CharacteristicsSensorData> => {
  return emptyCharacteristicsSensorData(timestamp, characteristics)
}
