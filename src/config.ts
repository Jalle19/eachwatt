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
import { getSensorData as getDummySensorData } from './dummy'
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

export interface Config {
  characteristics: Characteristics[]
  circuits: Circuit[]
  publishers: Publisher[]
}

export const parseConfig = (configFileContents: string): Config => {
  return YAML.parse(configFileContents) as Config
}

export const resolveAndValidateConfig = (config: Config): Config => {
  // Set various defaults
  if (!config.characteristics) {
    config.characteristics = []
  }

  if (!config.publishers) {
    config.publishers = []
  }

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
    if (circuit.parent) {
      const resolvedParent = config.circuits.find((c) => c.name === circuit.parent)
      if (!resolvedParent) {
        throw new Error(`Failed to resolve parent for circuit ${circuit.name}, parent is ${circuit.parent}`)
      }
      circuit.parent = resolvedParent
    }
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

      virtualSensor.virtual.children = resolveChildCircuits(virtualSensor.virtual.children as string[], config.circuits)
    }
  }

  // Resolve unmetered sensor parent and children
  for (const circuit of config.circuits) {
    if (circuit.sensor.type === SensorType.Unmetered) {
      const unmeteredSensor = circuit.sensor as UnmeteredSensor

      const parentCircuit = config.circuits.find((c) => c.name === unmeteredSensor.unmetered.parent)
      if (!parentCircuit) {
        throw new Error(`Failed to resolve unmetered sensor parent ${unmeteredSensor.unmetered.parent}`)
      }

      unmeteredSensor.unmetered.parent = parentCircuit
      unmeteredSensor.unmetered.children = resolveChildCircuits(
        unmeteredSensor.unmetered.children as string[],
        config.circuits,
      )
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
        break
      case SensorType.Dummy:
        circuit.sensor.pollFunc = getDummySensorData
        break
      default:
        throw new Error(`Unrecognized sensor type ${circuit.sensor.type}`)
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

  // Create publishers. Ignore any manually defined WebSocket publishers, we only support
  // one right now and it's added separately during application startup.
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
    }
  }

  return config
}

const resolveChildCircuits = (children: string[], circuits: Circuit[]): Circuit[] => {
  return children.map((c) => {
    const resolvedCircuit = circuits.find((cc) => cc.name === c)
    if (!resolvedCircuit) {
      throw new Error(`Failed to resolve child circuit "${c}`)
    }
    return resolvedCircuit
  })
}
