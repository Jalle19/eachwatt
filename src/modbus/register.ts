export enum RegisterType {
  HOLDING_REGISTER = 'h',
  INPUT_REGISTER = 'i',
  COIL = 'c',
  DISCRETE_INPUT = 'd',
}

const dataTypes = ['int16', 'uint16', 'int32', 'uint32', 'boolean', 'float']
export type DataType = (typeof dataTypes)[number]

export type ModbusRegister = {
  registerType: RegisterType
  address: number
  dataType: DataType
}

const REGISTER_DEFINITION_REGEXP = new RegExp('^([a-z]@)?(\\d+)(\\/[a-z0-9]*)?$')

export const stringify = (r: ModbusRegister): string => {
  return `${r.registerType}@${r.address}/${r.dataType}`
}

export const getRegisterLength = (r: ModbusRegister): number => {
  switch (r.dataType) {
    case 'int32':
    case 'uint32':
      return 4
    case 'int16':
    case 'uint16':
    case 'float':
      return 2
    case 'boolean':
    default:
      return 1
  }
}

export const parseRegisterDefinition = (definition: string): ModbusRegister => {
  const result = REGISTER_DEFINITION_REGEXP.exec(definition)

  if (result === null) {
    throw new Error(`Unable to parse register definition "${definition}"`)
  }

  let [, registerType, , dataType] = result
  const address = result[2]

  // Parse register type
  if (registerType === undefined) {
    registerType = getDefaultRegisterType()
  } else {
    registerType = registerType.substring(0, registerType.length - 1)
  }

  if (!isValidRegisterType(registerType)) {
    throw new Error(`Invalid register type specified: ${registerType}`)
  }

  // Parse data address
  const parsedAddress = parseInt(address, 10)

  // Parse data type
  if (dataType === undefined) {
    dataType = getDefaultDataType(registerType)
  } else {
    dataType = dataType.substring(1)
  }

  if (!isValidDataType(dataType)) {
    throw new Error(`Invalid data type specified: ${dataType}`)
  }

  return {
    registerType: registerType as RegisterType,
    address: parsedAddress,
    dataType,
  }
}

const getDefaultRegisterType = (): RegisterType => {
  return RegisterType.HOLDING_REGISTER
}

const getDefaultDataType = (registerType: RegisterType): DataType => {
  if (registerType === RegisterType.INPUT_REGISTER || registerType === RegisterType.HOLDING_REGISTER) {
    return 'int16'
  } else {
    return 'boolean'
  }
}

const isValidRegisterType = (registerType: string): registerType is RegisterType => {
  return Object.values<string>(RegisterType).includes(registerType)
}

const isValidDataType = (dataType: string): dataType is DataType => {
  return dataTypes.includes(dataType)
}
