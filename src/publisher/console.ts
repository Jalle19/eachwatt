import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData } from '../sensor'
import { createLogger } from '../logger'

export interface ConsolePublisher extends Publisher {
  type: PublisherType.Console
}

const logger = createLogger('publisher.console')

export class ConsolePublisherImpl implements PublisherImpl {
  async publishSensorData(sensorData: PowerSensorData[]): Promise<void> {
    for (const data of sensorData) {
      logger.info(`${data.circuit.name}: ${data.power}W`)
    }
  }

  async publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): Promise<void> {
    for (const data of sensorData) {
      logger.info(`${data.characteristics.name}: ${data.voltage}V, ${data.frequency}Hz`)
    }
  }
}
