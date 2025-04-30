interface JSONItem {
  name: string
  value: unknown
  path: string
  parentPath: string
  type: 'array' | 'object' | 'value'
  children?: JSONItem[]
  isOpen?: boolean
}

interface CustomData {
  fileType: string
  fileSize: string
}
