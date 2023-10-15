import { CharacteristicsSensor, CharacteristicsSensorData } from './sensor'

export type Characteristics = {
  name: string
  phase: string
  sensor: CharacteristicsSensor
}

export const pollCharacteristicsSensors = async (
  timestamp: number,
  characteristics: Characteristics[],
): Promise<CharacteristicsSensorData[]> => {
  const promises = []

  for (const c of characteristics) {
    const sensor = c.sensor

    promises.push(sensor.pollFunc(timestamp, c))
  }

  return await Promise.all(promises)
}
