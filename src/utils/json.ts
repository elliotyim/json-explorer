interface flattenProps {
  input: unknown
  name?: string
  parentPath?: string
}

export class JSONUtil {
  private static getFolder(
    input: unknown,
    name: string,
    value: unknown,
    path: string,
    parentPath: string,
  ): JSONItem | null {
    if (Array.isArray(value)) {
      return { name, value, path, parentPath, type: 'array' }
    } else if (typeof value === 'object' && input !== null) {
      return { name, value, path, parentPath, type: 'object' }
    } else {
      return null
    }
  }

  // static flatten({
  //   input,
  //   name,
  //   parentPath = 'root',
  // }: flattenProps): JSONItem[] {
  //   const result: JSONItem[] = []

  //   if (Array.isArray(input)) {
  //     input.forEach((value, i) => {
  //       const name = `${i}`
  //       const path = `${parentPath}[${i}]`
  //       const folder = this.getFolder(input, name, value, path, parentPath)

  //       if (folder) result.push(folder)
  //       result.push(...this.flatten({ name, input: value, parentPath: path }))
  //     })
  //   } else if (typeof input === 'object' && input !== null) {
  //     for (const [name, value] of Object.entries(input)) {
  //       const path = `${parentPath}.${name}`
  //       const folder = this.getFolder(input, name, value, path, parentPath)

  //       if (folder) result.push(folder)
  //       result.push(...this.flatten({ name, input: value, parentPath: path }))
  //     }
  //   } else {
  //     name = name ?? `${input}`

  //     const path = parentPath
  //     parentPath = path.slice(0, path.lastIndexOf(name)).replace(/[.[]$/, '')

  //     result.push({ name, value: input, path, parentPath, type: 'value' })
  //   }

  //   return result
  // }
  static convert({
    input,
    name,
    parentPath = 'root',
  }: flattenProps): JSONItem[] {
    const result: JSONItem[] = []

    if (Array.isArray(input)) {
      input.forEach((value, i) => {
        const name = `${i}`
        const path = `${parentPath}[${i}]`

        const folder = this.getFolder(input, name, value, path, parentPath)
        const val = this.convert({ name, input: value, parentPath: path })

        if (folder) {
          folder.children = val
          result.push(folder)
        } else {
          result.push(...val)
        }
      })
    } else if (typeof input === 'object' && input !== null) {
      for (const [name, value] of Object.entries(input)) {
        const path = `${parentPath}.${name}`

        const folder = this.getFolder(input, name, value, path, parentPath)
        const val = this.convert({ name, input: value, parentPath: path })

        if (folder) {
          folder.children = val
          result.push(folder)
        } else {
          result.push(...val)
        }
      }
    } else {
      name = name ?? `${input}`

      const path = parentPath
      parentPath = path.slice(0, path.lastIndexOf(name)).replace(/[.[]$/, '')

      const type = 'value'

      result.push({ name, value: input, path, parentPath, type })
    }

    return result
  }
}
