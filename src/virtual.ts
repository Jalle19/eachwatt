import { emptySensorData, SensorData, SensorPollFunction, VirtualSensor } from './sensor'
import { Circuit } from './circuit'

export const getSensorData: SensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: SensorData[],
): Promise<SensorData> => {
  if (!existingSensorData) {
    return emptySensorData(timestamp, circuit)
  }

  const sensor = circuit.sensor as VirtualSensor

  // Filter out sensor data not belonging to one of our configured children
  const childrenSensorData = existingSensorData.filter((d) => sensor.virtual.children.includes(d.circuit))

  return {
    timestamp: timestamp,
    circuit: circuit,
    watts: childrenSensorData.reduce((acc, data) => acc + data.watts, 0),
    unmeteredWatts: 0,
  }
}
