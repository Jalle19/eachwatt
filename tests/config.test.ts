import { resolveAndValidateConfig } from '../src/config'
import { SensorType, ShellySensor, ShellyType } from '../src/sensor'
import { Config } from '../src/config'
import { CircuitType } from '../src/circuit'

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
  const sensor = config.circuits[0].sensor as ShellySensor
  expect(sensor.shelly.type).toEqual(ShellyType.Gen1)
})
