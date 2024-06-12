import { emptySensorData, PowerSensorData, SensorType } from '../../src/sensor'
import { applyFilters, PowerSensorFilters } from '../../src/filter/filter'
import { Circuit } from '../../src/circuit'
import { getSensorData as getDummySensorData } from '../../src/sensor/dummy'
import exp = require('node:constants')

test('clamping works', () => {
  const filters: PowerSensorFilters = {}
  let data: PowerSensorData = dummySensorData()

  data.power = 10
  data = applyFilters(filters, data)
  expect(data.power).toEqual(10)

  data.power = -10
  data = applyFilters(filters, data)
  expect(data.power).toEqual(-10)

  filters.clamp = 'positive'
  data = applyFilters(filters, data)
  expect(data.power).toEqual(0)
})

test('high-pas works', () => {
  const filters: PowerSensorFilters = {}
  let data: PowerSensorData = dummySensorData()

  data.power = 100
  data = applyFilters(filters, data)
  expect(data.power).toEqual(100)

  data.power = 1.5
  filters.highPass = 2
  data = applyFilters(filters, data)
  expect(data.power).toEqual(0)
  data.power = 3
  data = applyFilters(filters, data)
  expect(data.power).toEqual(3)
})

const dummySensorData = (): PowerSensorData => {
  const circuit: Circuit = {
    name: 'dummy',
    children: [],
    sensor: {
      type: SensorType.Dummy,
      pollFunc: getDummySensorData,
    },
  }

  return emptySensorData(0, circuit)
}
