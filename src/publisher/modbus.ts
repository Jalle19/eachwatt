import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData } from '../sensor'

export type ModbusPublisherStaticRegister = {
  register: string
  value: string | number | boolean
}

export type ModbusPublisherSettings = {
  port: number
  unit: number
  staticRegisters?: ModbusPublisherStaticRegister[]
}

export interface ModbusPublisher extends Publisher {
  type: PublisherType.Modbus
  settings: ModbusPublisherSettings
}

export class ModbusPublisherImpl implements PublisherImpl {
  registry: Map<string, unknown>

  constructor (settings: ModbusPublisherSettings) {
    this.registry = new Map()

    for (const register of settings?.staticRegisters || []) {
      this.registry.set(register.register, register.value)
    }

    console.dir(this.registry)
  }

  publishCharacteristicsSensorData (sensorData: CharacteristicsSensorData[]): void {
  }

  publishSensorData (sensorData: PowerSensorData[]): void {
    for (const data of sensorData) {
      const modbusRegistry = data.circuit.modbusRegistry

      if (modbusRegistry) {
        if (modbusRegistry.power) {
          this.registry.set(modbusRegistry.power, data.power)
        }
        if (modbusRegistry.apparentPower && data.apparentPower) {
          this.registry.set(modbusRegistry.apparentPower, data.apparentPower)
        }
        if (modbusRegistry.powerFactor && data.powerFactor) {
          this.registry.set(modbusRegistry.powerFactor, data.powerFactor)
        }
        console.dir(this.registry)
      }
    }
  }
}
