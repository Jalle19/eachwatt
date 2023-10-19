import { Characteristics } from '../../characteristics'
import { Circuit } from '../../circuit'
import { TOPIC_PREFIX } from '../mqtt'
import slugify from 'slugify'

const slugifyName = (name: string): string => {
  // We can't have "+" in MQTT topic names
  return slugify(name, { remove: /[+]/ })
}

export const createCharacteristicsSensorTopicName = (characteristics: Characteristics, value: string): string => {
  return `${TOPIC_PREFIX}/characteristic/${slugifyName(characteristics.name)}/${value}`
}

export const createPowerSensorTopicName = (circuit: Circuit, value: string): string => {
  return `${TOPIC_PREFIX}/circuit/${slugifyName(circuit.name)}/${value}`
}
