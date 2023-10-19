import { connectAsync, MqttClient } from 'mqtt'
import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData } from '../sensor'
import { Config } from '../config'

const TOPIC_PREFIX = 'eachwatt'

export type MqttPublisherSettings = {
  brokerUrl: string
}

export interface MqttPublisher extends Publisher {
  type: PublisherType.MQTT
  settings: MqttPublisherSettings
}

type TopicValueMap = Map<string, string | number>

export class MqttPublisherImpl implements PublisherImpl {
  config: Config
  settings: MqttPublisherSettings
  client?: MqttClient

  constructor(config: Config, settings: MqttPublisherSettings) {
    this.config = config
    this.settings = settings

    connectAsync(this.settings.brokerUrl)
      .then((client) => {
        this.client = client
        console.log(`Connected to MQTT broker at ${this.settings.brokerUrl}`)
      })
      .catch((e) => {
        throw new Error(`Failed to connect to MQTT broker: ${e}`)
      })
  }

  async publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): Promise<void> {
    for (const data of sensorData) {
      const topicValueMap: TopicValueMap = new Map(
        Object.entries({
          [`${TOPIC_PREFIX}/characteristic/${data.characteristics.name}/voltage`]: data.voltage,
          [`${TOPIC_PREFIX}/characteristic/${data.characteristics.name}/frequency`]: data.frequency,
        }),
      )

      await this.publishTopicValues(topicValueMap)
    }
  }

  async publishSensorData(sensorData: PowerSensorData[]): Promise<void> {
    for (const data of sensorData) {
      const topicValueMap: TopicValueMap = new Map(
        Object.entries({
          [`${TOPIC_PREFIX}/circuit/${data.circuit.name}/power`]: data.watts,
        }),
      )

      await this.publishTopicValues(topicValueMap)
    }
  }

  private async publishTopicValues(topicValueMap: TopicValueMap): Promise<void> {
    const promises = []

    for (const [topic, value] of topicValueMap.entries()) {
      const message = String(value)

      // noinspection TypeScriptValidateTypes
      promises.push(this.client?.publishAsync(topic, message))
    }

    await Promise.all(promises)
  }
}
