import { PowerSensorData } from '../sensor'

export type PowerSensorFilters = {
  clamp?: 'positive'
  highPass?: number
}

export const applyFilters = (filters: PowerSensorFilters, data: PowerSensorData): PowerSensorData => {
  if (data.power === undefined) {
    return data
  }

  // Clamp
  if (filters?.clamp === 'positive') {
    data.power = Math.max(0, data.power)
  }

  // High-pass
  const highPass = filters?.highPass
  if (highPass !== undefined && data.power < highPass) {
    data.power = 0
  }

  return data
}
