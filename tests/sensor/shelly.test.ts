import { getSensorData } from '../../src/sensor/shelly'
import { Circuit } from '../../src/circuit'
import { SensorType, ShellySensor, ShellySensorSettings, ShellyType } from '../../src/sensor'
import fs from 'fs'

// Paths must be relative to project root where jest is run from
const gen1Response = fs.readFileSync('./tests/sensor/shelly-25.status.json')
const gen2emResponse = fs.readFileSync('./tests/sensor/shelly-pro-3m.EM.GetStatus.json')
const gen2pmResponse = fs.readFileSync('./tests/sensor/shelly-plus-1pm.Switch.GetStatus.json')

// Mock getDedupedResponse calls to return real-world data
jest.mock('../../src/http/client', () => ({
  getDedupedResponseBody: async (timestamp: number, url: string): Promise<string> => {
    let contents = ''

    switch (url) {
      case 'http://127.0.0.1/status':
        contents = String(gen1Response)
        break
      case 'http://127.0.0.1/rpc/EM.GetStatus?id=0':
        contents = String(gen2emResponse)
        break
      case 'http://127.0.0.1/rpc/Switch.GetStatus?id=0':
        contents = String(gen2pmResponse)
        break
    }

    return Promise.resolve(contents)
  },
}))

const createShellyCircuit = (sensorSettings: ShellySensorSettings): Circuit => {
  return {
    name: 'Some circuit',
    children: [],
    sensor: {
      type: SensorType.Shelly,
      pollFunc: getSensorData,
      shelly: sensorSettings,
    } as ShellySensor,
  }
}

test('parse gen1 response', async () => {
  const now = Date.now()
  const circuit = createShellyCircuit({
    type: ShellyType.Gen1,
    address: '127.0.0.1',
    meter: 0,
  })

  const sensorData = await getSensorData(now, circuit)
  expect(sensorData).toEqual({
    timestamp: now,
    circuit: circuit,
    power: 39.11,
  })
})

test('parse gen1 response, second meter', async () => {
  const now = Date.now()
  const circuit = createShellyCircuit({
    type: ShellyType.Gen1,
    address: '127.0.0.1',
    meter: 1,
  })

  const sensorData = await getSensorData(now, circuit)
  expect(sensorData).toEqual({
    timestamp: now,
    circuit: circuit,
    power: 0,
  })
})

test('parse gen2-em response', async () => {
  const now = Date.now()
  const circuit = createShellyCircuit({
    type: ShellyType.Gen2EM,
    address: '127.0.0.1',
    phase: 'a',
    meter: 0,
  })

  const sensorData = await getSensorData(now, circuit)
  expect(sensorData).toEqual({
    timestamp: now,
    circuit: circuit,
    power: 255.8,
    apparentPower: 339.4,
    powerFactor: 0.8,
  })
})

test('parse gen2-pm response', async () => {
  const now = Date.now()
  const circuit = createShellyCircuit({
    type: ShellyType.Gen2PM,
    address: '127.0.0.1',
    meter: 0,
  })

  const sensorData = await getSensorData(now, circuit)
  expect(sensorData).toEqual({
    timestamp: now,
    circuit: circuit,
    power: 105.7,
  })
})
