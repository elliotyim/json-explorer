interface JSONResult {
  name: string
  value: unknown
  path: string
  parentPath: string
  type: 'array' | 'object' | 'value'
  visible?: boolean
  open?: boolean
}
