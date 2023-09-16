import { SensorData, SensorPollFunction } from './sensor'
import { Circuit, pollCircuits } from './circuit'

export const getSensorData: SensorPollFunction = async (timestamp: number, circuit: Circuit): Promise<SensorData> => {
  // Poll each child sensor and combine the watts from them
  const sensorData = await pollCircuits(timestamp, circuit.children)

  return {
    timestamp: timestamp,
    circuit: circuit,
    watts: sensorData.reduce((acc, data) => acc + data.watts, 0),
    unmeteredWatts: 0,
  }
}
