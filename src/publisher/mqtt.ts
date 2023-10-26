import { connectAsync, MqttClient } from 'mqtt'
import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData } from '../sensor'
import { Config } from '../config'
import { createCharacteristicsSensorTopicName, createPowerSensorTopicName } from './mqtt/util'
import { configureMqttDiscovery } from './mqtt/homeassistant'
import { Logger } from 'winston'
import { createLogger } from '../logger'

export const TOPIC_PREFIX = 'eachwatt'
export const TOPIC_NAME_STATUS = `${TOPIC_PREFIX}/status`

export type MqttPublisherSettings = {
  brokerUrl: string
  homeAssistant?: {
    autoDiscovery: boolean
  }
}

export interface MqttPublisher extends Publisher {
  type: PublisherType.MQTT
  settings: MqttPublisherSettings
}

type TopicValueMap = Map<string, string | number>

export class MqttPublisherImpl implements PublisherImpl {
  config: Config
  settings: MqttPublisherSettings
  mqttClient?: MqttClient
  logger: Logger

  constructor(config: Config, settings: MqttPublisherSettings) {
    this.config = config
    this.settings = settings
    this.logger = createLogger('publisher.mqtt')

    // Connect to the broker
    connectAsync(this.settings.brokerUrl)
      .then((client) => {
        this.mqttClient = client
        this.logger.info(`Connected to MQTT broker at ${this.settings.brokerUrl}`)

        // Publish Home Assistant MQTT discovery messages
        if (this.settings.homeAssistant?.autoDiscovery) {
          configureMqttDiscovery(this.config, this.mqttClient)
            .then(() => {
              this.logger.info(`Configured Home Assistant MQTT discovery`)
            })
            .catch((e) => {
              throw new Error(`Failed to configure Home Assistant MQTT discovery: ${e}`)
            })
        }
      })
      .catch((e) => {
        throw new Error(`Failed to connect to MQTT broker: ${e}`)
      })
  }

  async publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): Promise<void> {
    for (const data of sensorData) {
      const topicValueMap: TopicValueMap = new Map()

      // Only publish when we have data
      if (data.voltage !== undefined) {
        topicValueMap.set(createCharacteristicsSensorTopicName(data.characteristics, 'voltage'), data.voltage)
      }
      if (data.frequency !== undefined) {
        topicValueMap.set(createCharacteristicsSensorTopicName(data.characteristics, 'frequency'), data.frequency)
      }

      await this.publishTopicValues(topicValueMap)
    }

    await this.publishStatus()
  }

  async publishSensorData(sensorData: PowerSensorData[]): Promise<void> {
    for (const data of sensorData) {
      const topicValueMap: TopicValueMap = new Map()

      // Only publish when we have data
      if (data.power !== undefined) {
        topicValueMap.set(createPowerSensorTopicName(data.circuit, 'power'), data.power)
      }
      if (data.apparentPower !== undefined) {
        topicValueMap.set(createPowerSensorTopicName(data.circuit, 'apparentPower'), data.apparentPower)
      }
      if (data.powerFactor !== undefined) {
        topicValueMap.set(createPowerSensorTopicName(data.circuit, 'powerFactor'), data.powerFactor)
      }

      await this.publishTopicValues(topicValueMap)
    }

    await this.publishStatus()
  }

  private async publishTopicValues(topicValueMap: TopicValueMap): Promise<void> {
    const promises = []

    for (const [topic, value] of topicValueMap.entries()) {
      const message = String(value)

      // noinspection TypeScriptValidateTypes
      promises.push(this.mqttClient?.publishAsync(topic, message))
    }

    await Promise.all(promises)
  }

  private async publishStatus(): Promise<void> {
    // noinspection TypeScriptValidateTypes
    await this.mqttClient?.publishAsync(TOPIC_NAME_STATUS, 'online')
  }
}
