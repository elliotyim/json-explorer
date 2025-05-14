import { NodeModel } from '@minoru/react-dnd-treeview'

interface FlattenProps {
  input: unknown
  name?: string
  parentPath?: string
  obj?: unknown
  depth?: number
}

interface SplitProps {
  path: string
  removeArrayBracket?: boolean
}

interface CopyProps {
  obj: unknown
  from: string
  to: string
  removeOriginal?: boolean
  relativeIndex?: number
}

export class JSONUtil {
  static getSplitPaths({
    path,
    removeArrayBracket = true,
  }: SplitProps): string[] {
    if (removeArrayBracket) {
      return path
        .replace(/\[(\w+)\]/g, '.$1')
        .replace(/^\./, '')
        .split('.')
    } else {
      return path.match(/[^.[\]]+|\[\d+\]/g) ?? []
    }
  }

  private static getParentPath(path: string): string {
    const splitPaths = this.getSplitPaths({ path, removeArrayBracket: false })
    if (splitPaths.length === 1) return path

    let parentPath = ''
    for (const splitPath of splitPaths.slice(0, -1)) {
      if (splitPath.endsWith(']')) parentPath += splitPath
      else if (parentPath) parentPath += `.${splitPath}`
      else parentPath = splitPath
    }

    return parentPath
  }

  private static getFolder(
    name: string,
    value: unknown,
    path: string,
    parentPath: string,
  ): NodeModel<CustomData> | null {
    const payload: NodeModel<CustomData> = {
      id: path,
      parent: parentPath,
      text: name,
      droppable: true,
    }
    if (Array.isArray(value)) {
      payload.data = { value, type: 'array' }
      return payload
    } else if (typeof value === 'object' && value !== null) {
      payload.data = { value, type: 'object' }
      return payload
    } else {
      return null
    }
  }

  private static getLastIndex(parh: string): number {
    const match = Array.from(parh.matchAll(/\[(\d+)\]/g))
    return parseInt(match[match.length - 1][1], 10)
  }

  private static getType(obj: unknown): CustomData['type'] {
    if (Array.isArray(obj)) return 'array'
    else if (typeof obj === 'object' && obj !== null) return 'object'
    else return 'value'
  }

  private static set(
    parent: unknown,
    destination: unknown,
    key: string,
    value: unknown,
    relativeIndex: number = -1,
  ) {
    if (Array.isArray(destination)) {
      if (relativeIndex === -1) {
        const parentType = this.getType(parent)
        if (parentType === 'object') destination.push({ [key]: value })
        else destination.push(value)
      } else if (this.getType(parent) === 'object') {
        destination.splice(relativeIndex, 0, { [key]: value })
      } else {
        destination.splice(relativeIndex, 0, value)
      }
    } else {
      const target = destination as Record<string, unknown>
      if (target[key] === undefined) target[key] = value
      else target[`${key}_copy`] = value
    }
  }

  static remove(parent: unknown, sourceId: string) {
    if (Array.isArray(parent)) {
      const sourceIndex = this.getLastIndex(sourceId)
      return parent.splice(sourceIndex, 1)
    } else if (typeof parent === 'object' && parent !== null) {
      const sourceIndexes = sourceId.split('.')
      const sourceIndex = sourceIndexes[sourceIndexes.length - 1]
      delete (parent as Record<string, unknown>)[sourceIndex]
    }
  }

  static getTrailingPaths(path: string): string[] {
    const result: string[] = []
    const paths = this.getSplitPaths({ path, removeArrayBracket: false })

    paths.reduce((acc, val) => {
      if (!acc) return val
      else if (val.startsWith('[')) acc += val
      else acc = `${acc}.${val}`

      result.push(acc)
      return acc
    }, '')

    return result
  }

  static getByPath(obj: unknown, path: string): unknown {
    const splitPaths = this.getSplitPaths({ path })
    if (splitPaths.length === 1 && splitPaths[0] === 'root') return obj

    return splitPaths.slice(1).reduce((acc, key) => {
      if (acc !== null && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key]
      }
      return undefined
    }, obj)
  }

  static flatten({
    input,
    name,
    parentPath = 'root',
    obj = input,
    depth = Number.MAX_SAFE_INTEGER,
  }: FlattenProps): NodeModel<CustomData>[] {
    const result: NodeModel<CustomData>[] = []

    if (Array.isArray(input)) {
      if (depth === 0) return result

      input.forEach((value, i) => {
        const name = `${i}`
        const path = `${parentPath}[${i}]`
        const folder = this.getFolder(name, value, path, parentPath)

        if (folder) result.push(folder)

        result.push(
          ...this.flatten({
            name,
            input: value,
            parentPath: path,
            obj,
            depth: depth - 1,
          }),
        )
      })
    } else if (typeof input === 'object' && input !== null) {
      if (depth === 0) return result

      for (const [name, value] of Object.entries(input)) {
        const path = `${parentPath}.${name}`
        const folder = this.getFolder(name, value, path, parentPath)

        if (folder) result.push(folder)

        result.push(
          ...this.flatten({
            name,
            input: value,
            parentPath: path,
            obj,
            depth: depth - 1,
          }),
        )
      }
    } else {
      const value = input
      name = name ?? `${value}`

      const path = parentPath
      parentPath = this.getParentPath(path)

      const payload: NodeModel<CustomData> = {
        id: path,
        parent: parentPath,
        text: `${name}`,
        droppable: false,
        data: { type: 'value', value },
      }

      result.push(payload)
    }

    return result
  }

  static copy({
    obj,
    from,
    to,
    relativeIndex = -1,
    removeOriginal = false,
  }: CopyProps): void {
    const parentPath = this.getParentPath(from)
    const parent = this.getByPath(obj, parentPath) as Record<string, unknown>
    const destination = this.getByPath(obj, to)
    const splitChildPaths = this.getSplitPaths({ path: from })

    const key = splitChildPaths[splitChildPaths.length - 1]
    const value = parent[key]

    if (Array.isArray(parent)) {
      if (Array.isArray(destination)) {
        const sourceIndex = this.getLastIndex(from)

        if (parent === destination && sourceIndex >= relativeIndex) {
          if (sourceIndex > relativeIndex) {
            if (removeOriginal) this.remove(parent, from)
            this.set(parent, destination, key, value, relativeIndex)
          }
          return
        }
      }

      this.set(parent, destination, key, value, relativeIndex)
      if (removeOriginal) this.remove(parent, from)
    } else {
      if (parent !== destination) {
        this.set(parent, destination, key, value, relativeIndex)
        if (removeOriginal) this.remove(parent, from)
      }
    }
  }
}
