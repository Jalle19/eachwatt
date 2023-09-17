import YAML from 'yaml'
import { getSensorData as getShellySensorData } from './shelly'
import { getSensorData as getIotawattSensorData } from './iotawatt'
import { getSensorData as getVirtualSensorData } from './virtual'
import { getSensorData as getUnmeteredSensorData } from './unmetered'
import { SensorType, UnmeteredSensor, VirtualSensor } from './sensor'
import { Circuit, CircuitType } from './circuit'
import { Publisher, PublisherType } from './publisher'
import { InfluxDBPublisher, InfluxDBPublisherImpl } from './influxdb'
import { ConsolePublisher, ConsolePublisherImpl } from './console'

export interface Config {
  circuits: Circuit[]
  publishers: Publisher[]
}

export const parseConfig = (configFileContents: string): Config => {
  const config = YAML.parse(configFileContents) as Config

  // Set type for circuits that don't have it defined
  for (const circuit of config.circuits) {
    if (circuit.type !== CircuitType.Main) {
      circuit.type = CircuitType.Circuit
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

  // Attach poll functions to sensors
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

  // Create publishers
  for (const publisher of config.publishers) {
    switch (publisher.type) {
      case PublisherType.InfluxDB:
        const influxDbPublisher = publisher as InfluxDBPublisher
        influxDbPublisher.publisherImpl = new InfluxDBPublisherImpl(influxDbPublisher.settings)
        break
      case PublisherType.Console:
        const consolePublisher = publisher as ConsolePublisher
        consolePublisher.publisherImpl = new ConsolePublisherImpl()
        break
    }
  }

  return config
}
