import { Characteristics } from '../../../src/characteristics'
import { createCharacteristicsSensorTopicName, createPowerSensorTopicName } from '../../../src/publisher/mqtt/util'
import { Circuit } from '../../../src/circuit'

test('creates correct topic names', () => {
  const characteristics = {
    name: 'Some characteristic',
  } as unknown as Characteristics

  let topic = createCharacteristicsSensorTopicName(characteristics, 'voltage')
  expect(topic).toEqual('eachwatt/characteristic/some-characteristic/voltage')

  const circuit = {
    name: 'Some circuit + with plus sign',
  } as unknown as Circuit

  topic = createPowerSensorTopicName(circuit, 'power')
  expect(topic).toEqual('eachwatt/circuit/some-circuit-with-plus-sign/power')
})
