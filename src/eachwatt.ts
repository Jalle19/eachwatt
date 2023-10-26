import http from 'http'
import yargs from 'yargs'
import fs from 'fs'
import { Config, parseConfig, resolveAndValidateConfig } from './config'
import { SensorType } from './sensor'
import { pollPowerSensors } from './circuit'
import { httpRequestHandler } from './http/server'
import { WebSocketPublisherImpl } from './publisher/websocket'
import { PublisherType } from './publisher'
import { pollCharacteristicsSensors } from './characteristics'
import { createLogger } from './logger'

// Set up a signal handler, so we can exit on Ctrl + C when run from Docker
process.on('SIGINT', () => {
  process.exit()
})

const argv = yargs(process.argv.slice(2))
  .usage('node $0 [options]')
  .options({
    'config': {
      description: 'The path to the configuration file',
      demandOption: true,
      alias: 'c',
    },
  })
  .parseSync()

const logger = createLogger('main')

const mainPollerFunc = async (config: Config) => {
  const now = Date.now()
  const circuits = config.circuits

  // Poll all normal circuit power sensors first
  const nonVirtualCircuits = circuits.filter(
    (c) => c.sensor.type !== SensorType.Virtual && c.sensor.type !== SensorType.Unmetered,
  )
  let powerSensorData = await pollPowerSensors(now, nonVirtualCircuits)

  // Poll virtual sensors, giving them the opportunity to act on the real sensor data we've gathered so far
  const virtualCircuits = circuits.filter((c) => c.sensor.type === SensorType.Virtual)
  const virtualSensorData = await pollPowerSensors(now, virtualCircuits, powerSensorData)
  powerSensorData = powerSensorData.concat(virtualSensorData)

  // Poll unmetered sensors
  const unmeteredCircuits = circuits.filter((c) => c.sensor.type === SensorType.Unmetered)
  const unmeteredSensorData = await pollPowerSensors(now, unmeteredCircuits, powerSensorData)
  powerSensorData = powerSensorData.concat(unmeteredSensorData)

  // Poll characteristics sensors
  const characteristicsSensorData = await pollCharacteristicsSensors(now, config.characteristics)

  // Round all numbers to one decimal point
  for (const data of powerSensorData) {
    if (data.power !== undefined) {
      data.power = Number(data.power.toFixed(1))
    }
  }

  // Publish data
  for (const publisher of config.publishers) {
    try {
      const publisherImpl = publisher.publisherImpl

      // Filter out hidden sensors from the sensor data
      const filteredSensorData = powerSensorData.filter((psd) => !psd.circuit.hidden)

      await Promise.all([
        publisherImpl.publishSensorData(filteredSensorData),
        publisherImpl.publishCharacteristicsSensorData(characteristicsSensorData),
      ])
    } catch (e) {
      logger.error((e as Error).message)
    }
  }
}

;(async () => {
  const configFile = argv.config as string
  if (!fs.existsSync(configFile)) {
    logger.error(`Configuration ${configFile} file does not exist or is not readable`)
    process.exit(-1)
  }

  const configFileContents = fs.readFileSync(configFile, 'utf8')
  const rawConfig = parseConfig(configFileContents)
  const config = resolveAndValidateConfig(rawConfig)

  // Create and start HTTP server
  const httpServer = http.createServer(httpRequestHandler)
  httpServer.listen(config.settings.httpPort, '0.0.0.0', () => {
    logger.info(`Started HTTP server on port ${config.settings.httpPort}`)
  })

  // Create a WebSocket server and register it as a publisher too
  const webSocketServer = new WebSocketPublisherImpl(configFileContents, httpServer)
  config.publishers.push({
    type: PublisherType.WebSocket,
    publisherImpl: webSocketServer,
  })

  // Start polling sensors
  const pollingInterval = config.settings.pollingInterval
  logger.info(`Polling sensors with interval ${pollingInterval} milliseconds`)
  await mainPollerFunc(config)
  setInterval(mainPollerFunc, pollingInterval, config)
})()
