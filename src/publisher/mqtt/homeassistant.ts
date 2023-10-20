import { MqttClient } from 'mqtt'
import { Config } from '../../config'
import { TOPIC_NAME_STATUS } from '../mqtt'
import { createPowerSensorTopicName, slugifyName } from './util'
import { supportsApparentPower, supportsPowerFactor } from '../../sensor'
import { Circuit } from '../../circuit'

export const configureMqttDiscovery = async (config: Config, mqttClient: MqttClient): Promise<void> => {
  const promises = []

  for (const circuit of config.circuits) {
    // Add power sensors
    promises.push(publishPowerSensorConfiguration(mqttClient, circuit))

    // Add apparent power sensors
    if (supportsApparentPower(circuit.sensor)) {
      promises.push(publishApparentPowerSensorConfiguration(mqttClient, circuit))
    }

    // Add power factor sensors
    if (supportsPowerFactor(circuit.sensor)) {
      promises.push(publishPowerFactorSensorConfiguration(mqttClient, circuit))
    }
  }

  await Promise.all(promises)
}

const getConfigurationBase = (): object => {
  return {
    'platform': 'mqtt',
    'availability_topic': TOPIC_NAME_STATUS,
    'state_class': 'measurement',
    'device': {
      'name': 'eachwatt',
      'model': 'Eachwatt',
      'identifiers': 'eachwatt',
    },
  }
}

const publishPowerSensorConfiguration = async (mqttClient: MqttClient, circuit: Circuit) => {
  const entityName = slugifyName(circuit.name)
  const uniqueId = `eachwatt_${entityName}_power`
  const configurationTopicName = `homeassistant/sensor/${uniqueId}/config`
  const configuration = {
    ...getConfigurationBase(),
    'device_class': 'power',
    'unit_of_measurement': 'W',
    'name': `${circuit.name} power`,
    'unique_id': uniqueId,
    'object_id': uniqueId,
    'state_topic': createPowerSensorTopicName(circuit, 'power'),
  }

  return mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
    retain: true,
  })
}

const publishApparentPowerSensorConfiguration = async (mqttClient: MqttClient, circuit: Circuit) => {
  const entityName = slugifyName(circuit.name)
  const uniqueId = `eachwatt_${entityName}_apparentPower`
  const configurationTopicName = `homeassistant/sensor/${uniqueId}/config`
  const configuration = {
    ...getConfigurationBase(),
    'device_class': 'apparent_power',
    'unit_of_measurement': 'VA',
    'name': `${circuit.name} apparent power`,
    'unique_id': uniqueId,
    'object_id': uniqueId,
    'state_topic': createPowerSensorTopicName(circuit, 'apparentPower'),
  }

  return mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
    retain: true,
  })
}

const publishPowerFactorSensorConfiguration = async (mqttClient: MqttClient, circuit: Circuit) => {
  const entityName = slugifyName(circuit.name)
  const uniqueId = `eachwatt_${entityName}_powerFactor`
  const configurationTopicName = `homeassistant/sensor/${uniqueId}/config`
  const configuration = {
    ...getConfigurationBase(),
    'device_class': 'power_factor',
    'name': `${circuit.name} power factor`,
    'unique_id': uniqueId,
    'object_id': uniqueId,
    'state_topic': createPowerSensorTopicName(circuit, 'powerFactor'),
  }

  // "retain" is used so that the entities will be available immediately after a Home Assistant restart
  return mqttClient.publishAsync(configurationTopicName, JSON.stringify(configuration), {
    retain: true,
  })
}
