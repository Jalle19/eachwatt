import { Characteristics } from '../../../src/characteristics'
import { createCharacteristicsSensorTopicName, createPowerSensorTopicName } from '../../../src/publisher/mqtt/util'
import { Circuit } from '../../../src/circuit'

test('creates correct topic names', () => {
  // Strips spaces
  const characteristics = {
    name: 'Some characteristic',
  } as unknown as Characteristics

  let topic = createCharacteristicsSensorTopicName(characteristics, 'voltage')
  expect(topic).toEqual('eachwatt/characteristic/some-characteristic/voltage')

  let circuit: Partial<Circuit>

  // Strips plus signs
  circuit = {
    name: 'Some circuit + with plus sign',
  }

  topic = createPowerSensorTopicName(circuit as Circuit, 'power')
  expect(topic).toEqual('eachwatt/circuit/some-circuit-with-plus-sign/power')

  // Strips forward slashes
  circuit = {
    name: 'Some circuit / with a slash',
  }

  topic = createPowerSensorTopicName(circuit as Circuit, 'power')
  expect(topic).toEqual('eachwatt/circuit/some-circuit-with-a-slash/power')

  // Strips dots
  circuit = {
    name: 'VE.Bus AC-In L3',
  }

  topic = createPowerSensorTopicName(circuit as Circuit, 'power')
  expect(topic).toEqual('eachwatt/circuit/vebus-ac-in-l3/power')
})
