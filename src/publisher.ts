import { CharacteristicsSensorData, PowerSensorData } from './sensor'

export enum PublisherType {
  InfluxDB = 'influxdb',
  Console = 'console',
  WebSocket = 'websocket',
}

export interface PublisherImpl {
  publishSensorData: (sensorData: PowerSensorData[]) => void
  publishCharacteristicsSensorData: (sensorData: CharacteristicsSensorData[]) => void
}

export interface Publisher {
  type: PublisherType
  publisherImpl: PublisherImpl
}
