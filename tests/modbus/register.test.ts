import { ModbusRegister, parseRegisterDefinition, RegisterType } from '../../src/modbus/register'

test('parse valid register definitions works', () => {
  const definitions: { raw: string; parsed: ModbusRegister }[] = [
    // Backward compatibility and sane default
    {
      'raw': '866',
      'parsed': {
        registerType: RegisterType.HOLDING_REGISTER,
        address: 866,
        dataType: 'int16',
      },
    },
    {
      'raw': 'i@32000/float',
      'parsed': {
        registerType: RegisterType.INPUT_REGISTER,
        address: 32000,
        dataType: 'float',
      },
    },
    {
      'raw': 'h@32100/uint32',
      'parsed': {
        registerType: RegisterType.HOLDING_REGISTER,
        address: 32100,
        dataType: 'uint32',
      },
    },
    {
      'raw': 'h@32200',
      'parsed': {
        registerType: RegisterType.HOLDING_REGISTER,
        address: 32200,
        dataType: 'int16',
      },
    },
    {
      'raw': 'c@100/boolean',
      'parsed': {
        registerType: RegisterType.COIL,
        address: 100,
        dataType: 'boolean',
      },
    },
    {
      'raw': 'c@100',
      'parsed': {
        registerType: RegisterType.COIL,
        address: 100,
        dataType: 'boolean',
      },
    },
    {
      'raw': 'd@200',
      'parsed': {
        registerType: RegisterType.DISCRETE_INPUT,
        address: 200,
        dataType: 'boolean',
      },
    },
  ]

  for (const definition of definitions) {
    const { raw, parsed } = definition

    expect(parseRegisterDefinition(raw)).toEqual(parsed)
  }
})

test('parse invalid register definitions works', () => {
  expect(() => parseRegisterDefinition('totally invalid')).toThrow('Unable to parse register definition')
  expect(() => parseRegisterDefinition('a@32000/float')).toThrow('Invalid register type specified')
  expect(() => parseRegisterDefinition('h@32000/foo')).toThrow('Invalid data type specified')
})
