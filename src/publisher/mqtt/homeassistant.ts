import { MqttClient } from 'mqtt'
import { Config } from '../../config'
import { TOPIC_NAME_STATUS } from '../mqtt'
import { createPowerSensorTopicName, slugifyName } from './util'

export const configureMqttDiscovery = async (
  config: Config,
  deviceIdentifier: string,
  mqttClient: MqttClient,
): Promise<void> => {
  // The "device" object that is part of each sensor's configuration payload
  const mqttDeviceInformation = {
    'name': deviceIdentifier,
    'model': 'Eachwatt',
    'identifiers': deviceIdentifier,
  }

  const configurationBase = {
    'platform': 'mqtt',
    'availability_topic': TOPIC_NAME_STATUS,
    'device': mqttDeviceInformation,
  }

  const promises = []

  for (const circuit of config.circuits) {
    // Add power sensors
    const entityName = slugifyName(circuit.name)
    const uniqueId = `${deviceIdentifier}_${entityName}_power`

    const configuration = {
      ...configurationBase,
      'state_class': 'measurement',
      'device_class': 'power',
      'unit_of_measurement': 'W',
      'name': `${circuit.name} power`,
      'unique_id': uniqueId,
      'object_id': uniqueId,
      'state_topic': createPowerSensorTopicName(circuit, 'power'),
    }

    // "retain" is used so that the entities will be available immediately after a Home Assistant restart
    const configurationTopicName = `homeassistant/sensor/eachwatt/${entityName}/config`
    promises.push(
      mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
        retain: true,
      }),
    )
  }

  await Promise.all(promises)
}
