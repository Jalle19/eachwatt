import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData } from '../sensor'
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client'
import { Circuit, CircuitType } from '../circuit'
import { Logger } from 'winston'
import { createLogger } from '../logger'

export interface InfluxDBPublisherSettings {
  url: string
  organizationId: string
  bucket: string
  apiToken: string
}

export interface InfluxDBPublisher extends Publisher {
  type: PublisherType.InfluxDB
  settings: InfluxDBPublisherSettings
  publisherImpl: InfluxDBPublisherImpl
}

export class InfluxDBPublisherImpl implements PublisherImpl {
  logger: Logger
  writeApi: WriteApi

  constructor(settings: InfluxDBPublisherSettings) {
    this.logger = createLogger('publisher.influxdb')

    this.logger.info(`Connecting to InfluxDB at ${settings.url}`)

    // Use millisecond precision since JavaScript timestamps use that
    this.writeApi = new InfluxDB({ url: settings.url, token: settings.apiToken }).getWriteApi(
      settings.organizationId,
      settings.bucket,
      'ms',
    )
  }

  async publishSensorData(sensorData: PowerSensorData[]): Promise<void> {
    for (const data of sensorData) {
      // Skip completely if sensor data is missing
      if (data.power === undefined) {
        continue
      }

      const power = new Point('power')
        .tag('circuit', data.circuit.name)
        .tag('circuitType', data.circuit.type as CircuitType)
        .tag('sensorType', data.circuit.sensor.type)
        .floatField('power', data.power)
        .timestamp(data.timestamp)

      // Optional data
      if (data.apparentPower) {
        power.floatField('apparentPower', data.apparentPower)
      }

      if (data.powerFactor) {
        power.floatField('powerFactor', data.powerFactor)
      }

      // Optional tags
      if (data.circuit.group) {
        power.tag('group', data.circuit.group)
      }

      if (data.circuit.parent) {
        power.tag('parent', (data.circuit.parent as Circuit).name)
      }

      if (data.circuit.phase) {
        power.tag('phase', data.circuit.phase)
      }

      this.writeApi.writePoint(power)
    }

    await this.writeApi.flush()
  }

  async publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): Promise<void> {
    for (const data of sensorData) {
      const characteristics = new Point('characteristics')
        .tag('name', data.characteristics.name)
        .tag('sensorType', data.characteristics.sensor.type)
        .tag('phase', data.characteristics.phase)
        .timestamp(data.timestamp)

      if (data.voltage !== undefined) {
        characteristics.floatField('voltage', data.voltage)
      }

      if (data.frequency !== undefined) {
        characteristics.floatField('frequency', data.frequency)
      }

      this.writeApi.writePoint(characteristics)
    }

    await this.writeApi.flush()
  }
}
