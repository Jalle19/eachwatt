import yargs from 'yargs'
import fs from 'fs'
import { Config, parseConfig } from './config'
import { SensorType } from './sensor'
import { pollCharacteristicsSensors, pollCircuits } from './circuit'

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

  // Poll all normal circuits first
  const nonVirtualCircuits = circuits.filter(
    (c) => c.sensor.type !== SensorType.Virtual && c.sensor.type !== SensorType.Unmetered,
  )
  let sensorData = await pollCircuits(now, nonVirtualCircuits)

  // Poll virtual sensors, giving them the opportunity to act on the real sensor data we've gathered so far
  const virtualCircuits = circuits.filter((c) => c.sensor.type === SensorType.Virtual)
  const virtualSensorData = await pollCircuits(now, virtualCircuits, sensorData)
  sensorData = sensorData.concat(virtualSensorData)

  // Poll unmetered sensors
  const unmeteredCircuits = circuits.filter((c) => c.sensor.type === SensorType.Unmetered)
  const unmeteredSensorData = await pollCircuits(now, unmeteredCircuits, sensorData)
  sensorData = sensorData.concat(unmeteredSensorData)

  // Poll characteristics sensors
  const characteristicsSensorData = await pollCharacteristicsSensors(now, config.characteristics)

  // Round all numbers to one decimal point
  for (const data of sensorData) {
    data.watts = Number(data.watts.toFixed(1))
  }

  // Publish data
  for (const publisher of config.publishers) {
    try {
      const publisherImpl = publisher.publisherImpl

      await Promise.all([
        publisherImpl.publishSensorData(sensorData),
        publisherImpl.publishCharacteristicsSensorData(characteristicsSensorData),
      ])
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
