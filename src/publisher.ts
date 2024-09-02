import { CharacteristicsSensorData, PowerSensorData } from './sensor'

export enum PublisherType {
  InfluxDB = 'influxdb',
  Console = 'console',
  WebSocket = 'websocket',
  MQTT = 'mqtt',
}

export interface PublisherImpl {
  publishSensorData: (sensorData: PowerSensorData[]) => Promise<void>
  publishCharacteristicsSensorData: (sensorData: CharacteristicsSensorData[]) => Promise<void>
}

export interface Publisher {
  type: PublisherType
  publisherImpl: PublisherImpl
}
