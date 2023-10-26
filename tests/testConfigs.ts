import { SensorType } from '../src/sensor'
import { Config } from '../src/config'
import { CircuitType } from '../src/circuit'

export const createVeryLowPollingIntervalConfig = (): Config => {
  return {
    settings: {
      pollingInterval: 50,
    },
    characteristics: [],
    circuits: [],
    publishers: [],
  }
}

export const createParentChildConfig = (): Config => {
  return {
    circuits: [
      {
        name: 'The parent',
        type: CircuitType.Main,
        phase: 'L1',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'The child',
        parent: 'The parent',
        sensor: {
          type: SensorType.Dummy,
        },
      },
    ],
  } as unknown as Config
}

export const createVirtualSensorConfig = (): Config => {
  return {
    circuits: [
      {
        name: 'Some circuit',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'Some virtual circuit',
        sensor: {
          type: SensorType.Virtual,
          virtual: {
            children: ['Some circuit'],
          },
        },
      },
    ],
  } as unknown as Config
}

export const createUnmeteredParentChildrenConfig = (): Config => {
  return {
    circuits: [
      {
        name: 'Total',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'Some sub-circuit',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'Some other sub-circuit',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'Unmetered',
        sensor: {
          type: SensorType.Unmetered,
          unmetered: {
            parent: 'Total',
            children: ['Some sub-circuit', 'Some other sub-circuit'],
          },
        },
      },
    ],
  } as unknown as Config
}

export const createNestedUnmeteredConfig = (): Config => {
  return {
    circuits: [
      {
        name: 'Total',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'Some sub-circuit',
        sensor: {
          type: SensorType.Dummy,
        },
      },
      {
        name: 'Some other unmetered circuit',
        sensor: {
          type: SensorType.Unmetered,
          unmetered: {
            parent: 'Total',
            children: [],
          },
        },
      },
      {
        name: 'Unmetered',
        sensor: {
          type: SensorType.Unmetered,
          unmetered: {
            parent: 'Total',
            children: ['Some sub-circuit', 'Some other unmetered circuit'],
          },
        },
      },
    ],
  } as unknown as Config
}
