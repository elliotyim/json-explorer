interface JSONObj {
  type: Record<string, unknown> | unknown[]
}

interface Data {
  id: string
  name: string
  value: unknown
  type: 'array' | 'object' | 'value'
  parentPath: string
  children?: Data[]
}
