import { Publisher, PublisherImpl, PublisherType } from './publisher'
import { CharacteristicsSensorData, PowerSensorData } from './sensor'

export interface ConsolePublisher extends Publisher {
  type: PublisherType.Console
}

export class ConsolePublisherImpl implements PublisherImpl {
  publishSensorData(sensorData: PowerSensorData[]): void {
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
