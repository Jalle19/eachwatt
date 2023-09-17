import yargs from 'yargs'
import fs from 'fs'
import { Config, parseConfig } from './config'
import { SensorData, SensorType } from './sensor'
import { pollCircuits } from './circuit'

const argv = yargs(process.argv.slice(2))
  .usage('node $0 [options]')
  .options({
    'config': {
      description: 'The path to the configuration file',
      demand: true,
      alias: 'c',
    },
  })
  .parseSync()

const mainPollerFunc = async (config: Config) => {
  const now = Date.now()
  const circuits = config.circuits

  // Poll all non-virtual circuits first
  const nonVirtualCircuits = circuits.filter((c) => c.sensor.type !== SensorType.Virtual)
  let sensorData = await pollCircuits(now, nonVirtualCircuits)

  // Calculate unmetered portions for each circuit with children
  for (const data of sensorData) {
    const circuit = data.circuit

    if (circuit.children.length === 0) {
      continue
    }

    data.unmeteredWatts = data.watts

    for (const childCircuit of circuit.children) {
      // Find the sensor data for the circuit
      const childSensorData = sensorData.find((s) => s.circuit === childCircuit) as SensorData
      data.unmeteredWatts -= childSensorData.watts
    }
  }

  // Poll virtual sensors, giving them the opportunity to act on the real sensor data we've gathered so far
  const virtualCircuits = circuits.filter((c) => c.sensor.type === SensorType.Virtual)
  const virtualSensorData = await pollCircuits(now, virtualCircuits, sensorData)

  // Combine real and virtual sensor data
  sensorData = sensorData.concat(virtualSensorData)

  // Round all numbers to one decimal point
  for (const data of sensorData) {
    data.watts = Number(data.watts.toFixed(1))
    data.unmeteredWatts = Number(data.unmeteredWatts.toFixed(1))
  }

  // Publish data
  for (const publisher of config.publishers) {
    try {
      await publisher.publisherImpl.publishSensorData(sensorData)
    } catch (e) {
      console.error((e as Error).message)
    }
  }
}

;(async () => {
  const configFile = argv.config as string
  if (!fs.existsSync(configFile)) {
    console.error(`Configuration ${configFile} file does not exist or is not readable`)
    process.exit(-1)
  }

  const configFileContents = fs.readFileSync(configFile, 'utf8')
  const config = parseConfig(configFileContents)

  await mainPollerFunc(config)
  setInterval(mainPollerFunc, 5000, config)
})()
