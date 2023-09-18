import { SensorData } from './sensor'
import { CharacteristicsSensorData } from './characteristics'

export enum PublisherType {
  InfluxDB = 'influxdb',
  Console = 'console',
}

export interface PublisherImpl {
  publishSensorData: (sensorData: SensorData[]) => void
  publishCharacteristicsSensorData: (sensorData: CharacteristicsSensorData[]) => void
}

export interface Publisher {
  type: PublisherType
  publisherImpl: PublisherImpl
}
