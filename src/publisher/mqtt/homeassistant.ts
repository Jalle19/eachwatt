import { MqttClient } from 'mqtt'
import slugify from 'slugify'
import { Config } from '../../config'
import { TOPIC_NAME_STATUS } from '../mqtt'
import { createPowerSensorTopicName } from './util'

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

  for (const circuit of config.circuits) {
    // Add power sensors
    const entityName = slugify(circuit.name)

    const configuration = {
      ...configurationBase,
      'state_class': 'measurement',
      'device_class': 'power',
      'unit_of_measurement': 'W',
      'name': `${circuit.name} power`,
      'unique_id': `eachwatt_${entityName}_power`,
      'object_id': `eachwatt_${entityName}_power`,
      'state_topic': createPowerSensorTopicName(circuit, 'power'),
    }

    // "retain" is used so that the entities will be available immediately after a Home Assistant restart
    const configurationTopicName = `homeassistant/sensor/eachwatt/${entityName}/config`
    await mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
      retain: true,
    })
  }
}
