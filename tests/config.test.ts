import { Config, resolveAndValidateConfig } from '../src/config'
import { SensorType, ShellySensor, ShellyType, UnmeteredSensor, VirtualSensor } from '../src/sensor'
import { CircuitType } from '../src/circuit'
import { createParentChildConfig, createUnmeteredParentChildrenConfig, createVirtualSensorConfig } from './testConfigs'

test('defaults are applied', () => {
  const config = resolveAndValidateConfig({
    circuits: [
      {
        name: 'Some circuit',
        // type should default to Circuit
        sensor: {
          type: SensorType.Shelly,
          shelly: {
            address: '127.0.0.1',
            // type should default to gen1
            meter: 0,
          },
        },
      },
    ],
  } as unknown as Config)

  expect(config.circuits[0].type).toEqual(CircuitType.Circuit)
  expect(config.circuits[0].hidden).toEqual(false)
  const sensor = config.circuits[0].sensor as ShellySensor
  expect(sensor.shelly.type).toEqual(ShellyType.Gen1)
})

test('parent and child circuit is resolved', () => {
  const config = resolveAndValidateConfig(createParentChildConfig())

  expect(config.circuits[1].parent).toEqual(config.circuits[0])
  expect(config.circuits[0].children).toEqual([config.circuits[1]])
})

test('throws error when parent circuit cannot be resolved', () => {
  const rawConfig = createParentChildConfig()
  rawConfig.circuits[1].parent = 'Some unknown parent'

  expect(() => resolveAndValidateConfig(rawConfig)).toThrow('Failed to resolve circuit')
})

test('circuit phase is resolved', () => {
  const config = resolveAndValidateConfig(createParentChildConfig())

  expect(config.circuits[1].phase).toEqual(config.circuits[0].phase)
  expect(config.circuits[1].phase).toEqual('L1')
})

test('virtual sensor children are resolved', () => {
  const config = resolveAndValidateConfig(createVirtualSensorConfig())

  const virtualSensor = config.circuits[1].sensor as VirtualSensor
  expect(virtualSensor.virtual.children).toEqual([config.circuits[0]])
})

test('unmetered sensor parent and children are resolved', () => {
  const rawConfig = createUnmeteredParentChildrenConfig()
  const config = resolveAndValidateConfig(rawConfig)

  const sensor = config.circuits[3].sensor as UnmeteredSensor
  expect(sensor.unmetered.parent).toEqual(config.circuits[0])
  expect(sensor.unmetered.children).toEqual([config.circuits[1], config.circuits[2]])
})

test('throws when unmetered sensor parent or children cannot be resolved', () => {
  // Unknown parent
  const unknownParentConfig = createUnmeteredParentChildrenConfig()
  unknownParentConfig.circuits[0].name = 'Unknown parent'

  expect(() => resolveAndValidateConfig(unknownParentConfig)).toThrow('Failed to resolve')

  // Unknown child
  const unknownChildConfig = createUnmeteredParentChildrenConfig()
  unknownChildConfig.circuits[2].name = 'Unknown child'

  expect(() => resolveAndValidateConfig(unknownChildConfig)).toThrow('Failed to resolve')
})
