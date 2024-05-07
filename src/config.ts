import YAML from 'yaml'
import {
  getCharacteristicsSensorData as getShellyCharacteristicsSensorData,
  getSensorData as getShellySensorData,
} from './sensor/shelly'
import {
  getCharacteristicsSensorData as getIotawattCharacteristicsSensorData,
  getSensorData as getIotawattSensorData,
} from './sensor/iotawatt'
import { getSensorData as getModbusSensorData } from './sensor/modbus'
import { getSensorData as getVirtualSensorData } from './sensor/virtual'
import { getSensorData as getUnmeteredSensorData } from './sensor/unmetered'
import {
  getCharacteristicsSensorData as getDummyCharacteristicsSensorData,
  getSensorData as getDummySensorData,
} from './sensor/dummy'
import {
  CharacteristicsSensorType,
  SensorType,
  ShellySensor,
  ShellyType,
  UnmeteredSensor,
  VirtualSensor,
} from './sensor'
import { Circuit, CircuitType, Main } from './circuit'
import { Publisher, PublisherType } from './publisher'
import { InfluxDBPublisher, InfluxDBPublisherImpl } from './publisher/influxdb'
import { ConsolePublisher, ConsolePublisherImpl } from './publisher/console'
import { Characteristics } from './characteristics'
import { MqttPublisher, MqttPublisherImpl } from './publisher/mqtt'

type MilliSeconds = number

type MainSettings = {
  pollingInterval?: MilliSeconds
  httpPort?: number
}

export type Config = {
  settings: MainSettings
  characteristics: Characteristics[]
  circuits: Circuit[]
  publishers: Publisher[]
}

const defaultSettings = (): MainSettings => {
  return {
    pollingInterval: 5000,
    httpPort: 8080,
  }
}

const MINIMUM_POLLING_INTERVAL: MilliSeconds = 2000

export const parseConfig = (configFileContents: string): Config => {
  return YAML.parse(configFileContents) as Config
}

export const resolveAndValidateConfig = (config: Config): Config => {
  // Set various defaults
  if (!config.settings) {
    config.settings = defaultSettings()
  }

  if (!config.characteristics) {
    config.characteristics = []
  }

  if (!config.publishers) {
    config.publishers = []
  }

  // Validate polling interval
  if (!config.settings.pollingInterval || config.settings.pollingInterval < MINIMUM_POLLING_INTERVAL) {
    throw new Error(`Polling interval is too low, minimum is ${MINIMUM_POLLING_INTERVAL} milliseconds`)
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

    // Sensors are not hidden by default
    if (circuit.hidden === undefined) {
      circuit.hidden = false
    }
  }

  // Resolve parent relationships
  for (const circuit of config.circuits) {
    if (circuit.parent) {
      circuit.parent = tryResolveCircuit(circuit.parent as string, config.circuits)
    }
  }

  // Resolve child relationships
  for (const circuit of config.circuits) {
    circuit.children = config.circuits.filter((c) => {
      return c.parent !== undefined && (c.parent as Circuit).name === circuit.name
    })
  }

  // Resolve phase for all circuits
  for (const circuit of config.circuits) {
    circuit.phase = resolvePhase(circuit)
  }

  // Resolve virtual sensor children
  for (const circuit of config.circuits) {
    if (circuit.sensor.type === SensorType.Virtual) {
      const virtualSensor = circuit.sensor as VirtualSensor

      virtualSensor.virtual.children = tryResolveChildCircuits(
        virtualSensor.virtual.children as string[],
        config.circuits,
      )
    }
  }

  // Resolve unmetered sensor parent and children
  for (const circuit of config.circuits) {
    if (circuit.sensor.type === SensorType.Unmetered) {
      const unmeteredSensor = circuit.sensor as UnmeteredSensor

      unmeteredSensor.unmetered.parent = tryResolveCircuit(unmeteredSensor.unmetered.parent as string, config.circuits)
      unmeteredSensor.unmetered.children = tryResolveChildCircuits(
        unmeteredSensor.unmetered.children as string[],
        config.circuits,
      )

      // Make sure we don't have other unmetered circuits as children
      const children = unmeteredSensor.unmetered.children as Circuit[]
      if (children.filter((c) => c.sensor.type === SensorType.Unmetered).length > 0) {
        throw new Error('Unmetered circuits cannot have other unmetered circuits as children')
      }
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
      case SensorType.Modbus:
        circuit.sensor.pollFunc = getModbusSensorData
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
      case CharacteristicsSensorType.Dummy:
        c.sensor.pollFunc = getDummyCharacteristicsSensorData
        break
    }
  }

  // Create publishers. Ignore any manually defined WebSocket publishers, we only support
  // one right now, and it's added separately during application startup.
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
      case PublisherType.MQTT: {
        const mqttPublisher = publisher as MqttPublisher
        mqttPublisher.publisherImpl = new MqttPublisherImpl(config, mqttPublisher.settings)
        break
      }
    }
  }

  return config
}

const tryResolveCircuit = (name: string, circuits: Circuit[]) => {
  const circuit = circuits.find((c) => c.name === name)
  if (!circuit) {
    throw new Error(`Failed to resolve circuit with name "${name}"`)
  }
  return circuit
}

const tryResolveChildCircuits = (children: string[], circuits: Circuit[]): Circuit[] => {
  return children.map((c) => {
    return tryResolveCircuit(c, circuits)
  })
}

const resolvePhase = (circuit: Circuit): string | undefined => {
  if (circuit.type === CircuitType.Main) {
    return (circuit as Main).phase
  } else if (typeof circuit.parent === 'object') {
    return resolvePhase(circuit.parent)
  } else {
    return undefined
  }
}
