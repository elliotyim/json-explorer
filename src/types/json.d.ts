interface CustomData {
  value: unknown
  type: 'array' | 'object' | 'value'
}

interface Data {
  id: string
  name: string
  value: unknown
  type: 'array' | 'object' | 'value'
  parentPath: string
  children?: Data[]
}
