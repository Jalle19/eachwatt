import YAML from 'yaml'
import {
  getCharacteristicsSensorData as getShellyCharacteristicsSensorData,
  getSensorData as getShellySensorData,
} from './shelly'
import {
  getCharacteristicsSensorData as getIotawattCharacteristicsSensorData,
  getSensorData as getIotawattSensorData,
} from './iotawatt'
import { getSensorData as getVirtualSensorData } from './virtual'
import { getSensorData as getUnmeteredSensorData } from './unmetered'
import {
  CharacteristicsSensorType,
  SensorType,
  ShellySensor,
  ShellyType,
  UnmeteredSensor,
  VirtualSensor,
} from './sensor'
import { Circuit, CircuitType } from './circuit'
import { Publisher, PublisherType } from './publisher'
import { InfluxDBPublisher, InfluxDBPublisherImpl } from './publisher/influxdb'
import { ConsolePublisher, ConsolePublisherImpl } from './publisher/console'
import { Characteristics } from './characteristics'
import { WebSocketPublisher, WebSocketPublisherImpl } from './publisher/websocket'

export interface Config {
  characteristics: Characteristics[]
  circuits: Circuit[]
  publishers: Publisher[]
}

export const parseConfig = (configFileContents: string): Config => {
  const config = YAML.parse(configFileContents) as Config

  // Set various defaults
  for (const circuit of config.circuits) {
    // Use Circuit as default circuit type
    if (circuit.type === undefined) {
      circuit.type = CircuitType.Circuit
    }

    if (circuit.sensor.type === SensorType.Shelly) {
      // Use Gen1 as default Shelly type
      const shellySensor = circuit.sensor as ShellySensor
      if (shellySensor.shelly.type === undefined) {
        shellySensor.shelly.type = ShellyType.Gen1
      }
    }
  }

  // Resolve parent relationships
  for (const circuit of config.circuits) {
    circuit.parent = config.circuits.find((c) => c.name === circuit.parent)
  }

  // Resolve child relationships
  for (const circuit of config.circuits) {
    circuit.children = config.circuits.filter((c) => {
      return c.parent !== undefined && (c.parent as Circuit).name === circuit.name
    })
  }

  // Resolve virtual sensor children
  for (const circuit of config.circuits) {
    if (circuit.sensor.type === SensorType.Virtual) {
      const virtualSensor = circuit.sensor as VirtualSensor

      virtualSensor.virtual.children = virtualSensor.virtual.children.map((c) => {
        return config.circuits.find((cc) => cc.name === c)
      }) as Circuit[]
    }
  }

  // Resolve unmetered sensor parent and children
  for (const circuit of config.circuits) {
    if (circuit.sensor.type === SensorType.Unmetered) {
      const unmeteredSensor = circuit.sensor as UnmeteredSensor

      unmeteredSensor.unmetered.parent = config.circuits.find(
        (c) => c.name === unmeteredSensor.unmetered.parent,
      ) as Circuit
      unmeteredSensor.unmetered.children = unmeteredSensor.unmetered.children.map((c) => {
        return config.circuits.find((cc) => cc.name === c)
      }) as Circuit[]
    }
  }

  // Attach poll functions to circuit sensors
  for (const circuit of config.circuits) {
    switch (circuit.sensor.type) {
      case SensorType.Shelly:
        circuit.sensor.pollFunc = getShellySensorData
        break
      case SensorType.Iotawatt:
        circuit.sensor.pollFunc = getIotawattSensorData
        break
      case SensorType.Virtual:
        circuit.sensor.pollFunc = getVirtualSensorData
        break
      case SensorType.Unmetered:
        circuit.sensor.pollFunc = getUnmeteredSensorData
    }
  }

  // Attach poll function to characteristics sensors
  for (const c of config.characteristics) {
    switch (c.sensor.type) {
      case CharacteristicsSensorType.Iotawatt:
        c.sensor.pollFunc = getIotawattCharacteristicsSensorData
        break
      case CharacteristicsSensorType.Shelly:
        c.sensor.pollFunc = getShellyCharacteristicsSensorData
        break
    }
  }

  // Create publishers
  for (const publisher of config.publishers) {
    switch (publisher.type) {
      case PublisherType.InfluxDB: {
        const influxDbPublisher = publisher as InfluxDBPublisher
        influxDbPublisher.publisherImpl = new InfluxDBPublisherImpl(influxDbPublisher.settings)
        break
      }
      case PublisherType.Console: {
        const consolePublisher = publisher as ConsolePublisher
        consolePublisher.publisherImpl = new ConsolePublisherImpl()
        break
      }
      case PublisherType.WebSocket: {
        const webSocketPublisher = publisher as WebSocketPublisher
        // Pass the raw configuration to it
        webSocketPublisher.publisherImpl = new WebSocketPublisherImpl(configFileContents, webSocketPublisher.settings)
        break
      }
    }
  }

  return config
}
