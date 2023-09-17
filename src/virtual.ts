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
  const meteredChildrenSensorData = existingSensorData.filter((d) =>
    sensor.virtual.meteredChildren.includes(d.circuit.name),
  )
  const unmeteredChildrenSensorData = existingSensorData.filter((d) =>
    sensor.virtual.unmeteredChildren.includes(d.circuit.name),
  )

  // Compute watts and unmetered watts
  const wattsTotal = meteredChildrenSensorData.reduce((acc, data) => acc + data.watts, 0)
  const unmeteredWattsTotal = wattsTotal - unmeteredChildrenSensorData.reduce((acc, data) => acc + data.watts, 0)
  return {
    timestamp: timestamp,
    circuit: circuit,
    watts: wattsTotal,
    unmeteredWatts: unmeteredWattsTotal,
  }
}
