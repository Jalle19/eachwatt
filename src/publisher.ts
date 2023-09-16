import { SensorData } from './sensor'

export enum PublisherType {
  InfluxDB = 'influxdb',
  Console = 'console',
}

export interface PublisherImpl {
  publishSensorData: (sensorData: SensorData[]) => void
}

export interface Publisher {
  type: PublisherType
  publisherImpl: PublisherImpl
}
