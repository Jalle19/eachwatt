import { MqttClient } from 'mqtt'
import { Config } from '../../config'
import { TOPIC_NAME_STATUS } from '../mqtt'
import { createPowerSensorTopicName, slugifyName } from './util'
import { supportsApparentPower, supportsPowerFactor } from '../../sensor'

export const configureMqttDiscovery = async (config: Config, mqttClient: MqttClient): Promise<void> => {
  // The "device" object that is part of each sensor's configuration payload
  const mqttDeviceInformation = {
    'name': 'eachwatt',
    'model': 'Eachwatt',
    'identifiers': 'eachwatt',
  }

  const configurationBase = {
    'platform': 'mqtt',
    'availability_topic': TOPIC_NAME_STATUS,
    'device': mqttDeviceInformation,
    'state_class': 'measurement',
  }

  const promises = []

  for (const circuit of config.circuits) {
    const entityName = slugifyName(circuit.name)

    // Add power sensors
    const uniqueId = `eachwatt_${entityName}_power`
    const configurationTopicName = `homeassistant/sensor/${uniqueId}/config`
    const configuration = {
      ...configurationBase,
      'device_class': 'power',
      'unit_of_measurement': 'W',
      'name': `${circuit.name} power`,
      'unique_id': uniqueId,
      'object_id': uniqueId,
      'state_topic': createPowerSensorTopicName(circuit, 'power'),
    }

    // "retain" is used so that the entities will be available immediately after a Home Assistant restart
    promises.push(
      mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
        retain: true,
      }),
    )

    // Add apparent power sensors
    if (supportsApparentPower(circuit.sensor)) {
      const uniqueId = `eachwatt_${entityName}_apparentPower`
      const configurationTopicName = `homeassistant/sensor/${uniqueId}/config`
      const configuration = {
        ...configurationBase,
        'device_class': 'apparent_power',
        'unit_of_measurement': 'VA',
        'name': `${circuit.name} apparent power`,
        'unique_id': uniqueId,
        'object_id': uniqueId,
        'state_topic': createPowerSensorTopicName(circuit, 'apparentPower'),
      }

      // "retain" is used so that the entities will be available immediately after a Home Assistant restart
      promises.push(
        mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
          retain: true,
        }),
      )
    }

    // Add power factor sensors
    if (supportsPowerFactor(circuit.sensor)) {
      const uniqueId = `eachwatt_${entityName}_powerFactor`
      const configurationTopicName = `homeassistant/sensor/${uniqueId}/config`
      const configuration = {
        ...configurationBase,
        'device_class': 'power_factor',
        'name': `${circuit.name} power factor`,
        'unique_id': uniqueId,
        'object_id': uniqueId,
        'state_topic': createPowerSensorTopicName(circuit, 'powerFactor'),
      }

      // "retain" is used so that the entities will be available immediately after a Home Assistant restart
      promises.push(
        mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
          retain: true,
        }),
      )
    }
  }

  await Promise.all(promises)
}
