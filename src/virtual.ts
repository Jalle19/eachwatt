import { emptySensorData, PowerSensorData, PowerSensorPollFunction, VirtualSensor } from './sensor'
import { Circuit } from './circuit'

export const getSensorData: PowerSensorPollFunction = async (
  timestamp: number,
  circuit: Circuit,
  existingSensorData?: PowerSensorData[],
): Promise<PowerSensorData> => {
  if (!existingSensorData) {
    return emptySensorData(timestamp, circuit)
  }

  const sensor = circuit.sensor as VirtualSensor

  // Filter out sensor data not belonging to one of our configured children
  const childrenSensorData = existingSensorData.filter((d) => sensor.virtual.children.includes(d.circuit))

  return {
    timestamp: timestamp,
    circuit: circuit,
    power: childrenSensorData.reduce((acc, data) => acc + (data.power ?? 0), 0),
  }
}
