import { Publisher, PublisherImpl, PublisherType } from './publisher'
import { SensorData } from './sensor'
import { CharacteristicsSensorData } from './characteristics'

export interface ConsolePublisher extends Publisher {
  type: PublisherType.Console
}

export class ConsolePublisherImpl implements PublisherImpl {
  publishSensorData(sensorData: SensorData[]): void {
    for (const data of sensorData) {
      console.log(`${data.timestamp}: ${data.circuit.name}: ${data.watts}W`)
    }
  }

  publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): void {
    for (const data of sensorData) {
      console.log(`${data.timestamp}: ${data.characteristics.name}: ${data.voltage}V, ${data.frequency}Hz`)
    }
  }
}
