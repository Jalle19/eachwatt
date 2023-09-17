import { emptySensorData, reduceToWatts, SensorData, SensorPollFunction, UnmeteredSensor } from './sensor'
import { Circuit } from './circuit'

export const getSensorData: SensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: SensorData[],
): Promise<SensorData> => {
  if (!existingSensorData) {
    return emptySensorData(timestamp, circuit)
  }

  const sensor = circuit.sensor as UnmeteredSensor

  // Get the parent usage
  const parentWatts = reduceToWatts(existingSensorData.filter((d) => d.circuit === sensor.unmetered.parent))
  const unmeteredWatts = reduceToWatts(existingSensorData.filter((d) => sensor.unmetered.children.includes(d.circuit)))

  return {
    timestamp,
    circuit,
    watts: Math.max(parentWatts - unmeteredWatts, 0), // Don't allow negative values
  }
}
