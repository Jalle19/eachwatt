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
import { createLogger, LogLevel, setLogLevel } from './logger'
import { setRequestTimeout as setHttpRequestTimeout } from './http/client'
import { setRequestTimeout as setModbusRequestTimeout } from './modbus/client'
import { setIntervalAsync } from 'set-interval-async'

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
    'verbose': {
      description: 'Enable verbose logging',
      alias: 'v',
    },
  })
  .parseSync()

const logger = createLogger('main')
if (argv.verbose) {
  logger.info('Setting log level to DEBUG')
  setLogLevel(LogLevel.DEBUG)
}

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

  // Post-process power sensor data
  powerSensorData = powerSensorData.map((data) => {
    if (data.power !== undefined) {
      // Round all numbers to one decimal point
      data.power = Number(data.power.toFixed(1))
    }

    return data
  })

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
      logger.error(e)
    }
  }
}

void (async () => {
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

  // Adjust request timeouts to be half that of the polling interval
  const pollingInterval = config.settings.pollingInterval as number
  logger.info(`Polling sensors with interval ${pollingInterval} milliseconds`)
  const timeoutMs = pollingInterval / 2
  setHttpRequestTimeout(timeoutMs)
  setModbusRequestTimeout(timeoutMs)

  // Start polling sensors
  await mainPollerFunc(config)
  setIntervalAsync(mainPollerFunc, pollingInterval, config)
})()
