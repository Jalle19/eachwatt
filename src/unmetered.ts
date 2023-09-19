import { emptySensorData, reduceToWatts, PowerSensorData, PowerSensorPollFunction, UnmeteredSensor } from './sensor'
import { Circuit } from './circuit'

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: PowerSensorData[],
): Promise<PowerSensorData> => {
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
