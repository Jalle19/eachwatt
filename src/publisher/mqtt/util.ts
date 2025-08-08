import { Characteristics } from '../../characteristics'
import { Circuit } from '../../circuit'
import { TOPIC_PREFIX } from '../mqtt'
import slugify from 'slugify'

export const slugifyName = (name: string): string => {
  return slugify(name, {
    // We can't have "+", "." and "/" in MQTT topic names
    remove: /[+/.]/,
    // Since the rest of the topic name is lower-case, just lower-case everything
    lower: true,
  })
}

export const createCharacteristicsSensorTopicName = (characteristics: Characteristics, value: string): string => {
  return `${TOPIC_PREFIX}/characteristic/${slugifyName(characteristics.name)}/${value}`
}

export const createPowerSensorTopicName = (circuit: Circuit, value: string): string => {
  return `${TOPIC_PREFIX}/circuit/${slugifyName(circuit.name)}/${value}`
}
