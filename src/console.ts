import { Publisher, PublisherImpl, PublisherType } from './publisher'
import { SensorData } from './sensor'

export interface ConsolePublisher extends Publisher {
  type: PublisherType.Console
}

export class ConsolePublisherImpl implements PublisherImpl {
  publishSensorData(sensorData: SensorData[]): void {
    for (const data of sensorData) {
      console.log(`${data.timestamp}: ${data.circuit.name}: ${data.watts}, ${data.unmeteredWatts}`)
    }
  }
}
