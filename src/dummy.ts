import { emptySensorData, PowerSensorData, PowerSensorPollFunction } from './sensor'
import { Circuit } from './circuit'

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  existingSensorData?: PowerSensorData[],
): Promise<PowerSensorData> => {
  return emptySensorData(timestamp, circuit)
}
