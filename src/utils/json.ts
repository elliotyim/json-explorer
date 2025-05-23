interface CompileProps {
  input: unknown
  name?: string
  path?: string
  parentPath?: string
  depth?: number
}

interface FlattenProps {
  input: unknown
  name?: string
  parentPath?: string
  depth?: number
}

interface SplitProps {
  path: string
  removeArrayBracket?: boolean
}

interface MoveProps {
  obj: unknown
  from: string
  to: string
  targetIndex?: number
}

interface CopyProps extends MoveProps {
  removeOriginal?: boolean
}

interface SetProps {
  obj: Record<string, unknown> | unknown[]
  keyPath: string
  value: unknown
}

interface InspectProps {
  obj: Record<string, unknown> | unknown[]
  path: string
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

  static getParentPath(path: string): string {
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
  ): Data | null {
    const payload: Data = {
      id: path,
      name,
      value,
      type: 'value',
      parentPath,
    }
    if (Array.isArray(value)) {
      payload.type = 'array'
      return payload
    } else if (typeof value === 'object' && value !== null) {
      payload.type = 'object'
      return payload
    } else {
      return null
    }
  }

  private static getLastKey(path: string): string {
    const lastKey = this.getSplitPaths({ path }).at(-1)
    if (!lastKey) throw Error(`Invalid path provided: ${path}`)
    return lastKey
  }

  private static getLastIndex(parh: string): number {
    const match = Array.from(parh.matchAll(/\[(\d+)\]/g))
    return parseInt(match[match.length - 1][1], 10)
  }

  static getType(obj: unknown): CustomData['type'] {
    if (Array.isArray(obj)) return 'array'
    else if (typeof obj === 'object' && obj !== null) return 'object'
    else return 'value'
  }

  private static add(
    parent: unknown,
    destination: unknown,
    key: string,
    value: unknown,
    targetIndex: number = -1,
  ) {
    if (Array.isArray(destination)) {
      if (targetIndex === -1) {
        const parentType = this.getType(parent)
        if (parentType === 'object') destination.push({ [key]: value })
        else destination.push(value)
      } else if (this.getType(parent) === 'object') {
        destination.splice(targetIndex, 0, { [key]: value })
      } else {
        destination.splice(targetIndex, 0, value)
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
      const lastKey = this.getLastKey(sourceId)
      delete (parent as Record<string, unknown>)[lastKey]
    }
  }

  static removeAll(parent: unknown, sourceIds: string[]) {
    if (Array.isArray(parent)) {
      const lastIndexes = sourceIds
        .map((id) => this.getLastIndex(id))
        .sort((a, b) => b - a)
      lastIndexes.forEach((id) => this.remove(parent, `[${id}]`))
    } else {
      sourceIds.forEach((id) => this.remove(parent, id))
    }
  }

  static getTrailingPaths(path: string): string[] {
    const result: string[] = []
    const paths = this.getSplitPaths({ path, removeArrayBracket: false })

    paths.reduce((acc, val) => {
      if (!acc) acc = val
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

  static compile({
    input,
    name,
    path = 'root',
    parentPath = 'root',
    depth = Number.MAX_SAFE_INTEGER,
  }: CompileProps): Data[] {
    const result: Data[] = []

    if (Array.isArray(input)) {
      const folder: Data = {
        id: path,
        name: name ?? path,
        value: input,
        type: 'array',
        parentPath,
        children: [],
      }

      input.forEach((value, i) => {
        const name = `${i}`
        const childPath = `${path}[${i}]`

        folder.children?.push(
          ...this.compile({
            input: value,
            name,
            path: childPath,
            parentPath,
            depth: depth - 1,
          }),
        )
      })

      result.push(folder)
    } else if (typeof input === 'object' && input != null) {
      const folder: Data = {
        id: path,
        name: name ?? path,
        value: input,
        type: 'object',
        parentPath,
        children: [],
      }

      for (const [name, value] of Object.entries(input)) {
        const childPath = `${path}.${name}`

        folder.children?.push(
          ...this.compile({
            name,
            input: value,
            path: childPath,
            parentPath,
            depth: depth - 1,
          }),
        )
      }

      result.push(folder)
    } else {
      const id = path
      const value = input

      name = name ?? path

      const payload: Data = { id, name, value, type: 'value', parentPath }

      result.push(payload)
    }

    return result
  }

  static flatten({
    input,
    name,
    parentPath = 'root',
    depth = Number.MAX_SAFE_INTEGER,
  }: FlattenProps): Data[] {
    const result: Data[] = []

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
            depth: depth - 1,
          }),
        )
      }
    } else {
      const value = input
      name = name ?? `${value}`

      const path = parentPath
      parentPath = this.getParentPath(path)

      const payload: Data = {
        id: path,
        name: `${name}`,
        value,
        type: 'value',
        parentPath,
      }

      result.push(payload)
    }

    return result
  }

  static copy({
    obj,
    from,
    to,
    targetIndex = -1,
    removeOriginal = false,
  }: CopyProps): void {
    const parentPath = this.getParentPath(from)
    const parent = this.getByPath(obj, parentPath) as Record<string, unknown>
    const destination = parentPath === to ? parent : this.getByPath(obj, to)

    const splitSourcePaths = this.getSplitPaths({ path: from })

    const key = splitSourcePaths[splitSourcePaths.length - 1]
    const value = parent[key]

    if (Array.isArray(parent)) {
      if (Array.isArray(destination)) {
        const sourceIndex = this.getLastIndex(from)

        if (parent === destination && sourceIndex >= targetIndex) {
          if (sourceIndex > targetIndex) {
            if (removeOriginal) this.remove(parent, from)
            this.add(parent, destination, key, value, targetIndex)
          }
          return
        }
      }

      this.add(parent, destination, key, value, targetIndex)
      if (removeOriginal) this.remove(parent, from)
    } else {
      if (parent !== destination) {
        this.add(parent, destination, key, value, targetIndex)
        if (removeOriginal) this.remove(parent, from)
      }
    }
  }

  static move({ obj, from, to, targetIndex = -1 }: MoveProps): void {
    this.copy({ obj, from, to, targetIndex, removeOriginal: true })
  }

  static set({
    obj,
    keyPath,
    value,
  }: SetProps): Record<string, unknown> | unknown[] {
    const keyPaths = this.getSplitPaths({ path: keyPath })
    if (keyPaths.length === 1 && keyPaths[0] === 'root') {
      obj = value as Record<string, unknown>
      return structuredClone(obj)
    }

    let target = obj as Record<string, unknown>
    for (const key of keyPaths.slice(1, -1)) {
      target = target[key] as Record<string, unknown>
    }

    const lastKey = this.getLastKey(keyPath)
    target[lastKey] = value

    return structuredClone(obj)
  }

  static inspect({ obj, path }: InspectProps): Data {
    const parentPath = this.getParentPath(path)
    const parent = this.getByPath(obj, parentPath) as Record<string, unknown>

    const lastKey = this.getLastKey(path)

    const value = lastKey === 'root' ? obj : parent[lastKey]
    const type = this.getType(value)

    const payload: Data = {
      id: path,
      name: lastKey,
      value,
      type,
      parentPath,
    }

    return payload
  }

  static sortIndexPaths(paths: string[]): string[] {
    return paths.sort((a, b) => this.getLastIndex(a) - this.getLastIndex(b))
  }

  static copyItems(
    obj: Record<string, unknown> | unknown[],
    ids: string[],
  ): void {
    if (!ids.length) throw Error('ids should not be empty!')

    const result = ids.map((id) => {
      const target = this.inspect({ obj, path: id })
      return { [target.name]: target.value }
    })

    sessionStorage.setItem('copyPaste', JSON.stringify(result))
  }

  static pastItems(
    obj: Record<string, unknown> | unknown[],
    currentPath: string,
  ): Record<string, unknown> | unknown[] {
    const jsonString = sessionStorage.getItem('copyPaste')
    const newJSON = structuredClone(obj)

    if (jsonString == null) return {}

    const target = this.getByPath(newJSON, currentPath)
    const sources = JSON.parse(jsonString)

    if (Array.isArray(target)) {
      for (const source of sources) {
        Object.values(source).forEach((val) => target.push(val))
      }
    } else {
      for (const source of sources) {
        for (const [key, value] of Object.entries(source)) {
          const typedTarget = target as Record<string, unknown>
          if (typedTarget[key]) typedTarget[`${key}_copy`] = value
          else typedTarget[key] = value
        }
      }
    }

    this.set({ obj: newJSON, keyPath: currentPath, value: target })
    return newJSON
  }

  static deleteItems(
    obj: Record<string, unknown> | unknown[],
    ids: string[],
  ): Record<string, unknown> | unknown[] {
    if (!ids.length) throw Error('ids should not be empty!')
    const newJSON = structuredClone(obj)

    const parentPath = this.getParentPath(ids[0])
    const parent = this.getByPath(newJSON, parentPath)

    this.removeAll(parent, ids)
    return newJSON
  }

  static cutItems(
    obj: Record<string, unknown> | unknown[],
    ids: string[],
  ): Record<string, unknown> | unknown[] {
    if (!ids.length) throw Error('ids should not be empty!')

    this.copyItems(obj, ids)
    const resultJSON = this.deleteItems(obj, ids)

    return resultJSON
  }

  static replaceLastKey(path: string, replacer: string): string {
    const splitPaths = this.getSplitPaths({ path, removeArrayBracket: false })
    const lastIndex = path.lastIndexOf(splitPaths.at(-1)!)
    const newPath = path.substring(0, lastIndex)
    return `${newPath}${replacer}`
  }

  static relocate(
    obj: Record<string, unknown> | unknown[],
    targetIndex: number,
    selectedNodes: { index: number; data: Data }[],
  ): Record<string, unknown> | unknown[] | null {
    if (!selectedNodes.length) return null

    const parentPath = selectedNodes[0].data.parentPath
    const json = structuredClone(obj)

    const parent = JSONUtil.getByPath(json, parentPath) as unknown[]
    const toBeChanged = new Set(selectedNodes.map((node) => node.index))
    const values = []

    if (targetIndex === -1) targetIndex = parent.length

    for (const [index, value] of parent.entries()) {
      if (index === targetIndex) {
        selectedNodes.forEach((node) => {
          const data = node.data
          if (data.type === 'object') values.push({ [data.name]: data.value })
          else values.push(data.value)
        })
      }
      if (!toBeChanged.has(index)) {
        values.push(value)
      }
    }

    if (targetIndex === parent.length) {
      selectedNodes.forEach((node) => values.push(node.data.value))
    }

    const result = JSONUtil.set({
      obj: json,
      keyPath: parentPath,
      value: values,
    })

    const newJSON = Array.isArray(result) ? [...result] : { ...result }
    return newJSON
  }

  static adjustArrayPath(from: string, to: string): string {
    const splitFrom = this.getSplitPaths({
      path: from,
      removeArrayBracket: false,
    })
    const splitTo = this.getSplitPaths({ path: to, removeArrayBracket: false })

    for (const [i, _from] of splitFrom.entries()) {
      if (i >= splitTo.length) break

      const _to = splitTo[Number(i)]

      if (_from !== to) {
        if (_from.startsWith('[') && _to.startsWith('[')) {
          const fromKey = Number(_from.substring(1, _from.length - 1))
          const toKey = Number(_to.substring(1, _from.length - 1))

          if (fromKey < toKey) splitTo[Number(i)] = `[${toKey - 1}]`
        }
      }
    }

    let result = ''
    splitTo.forEach((str, index) => {
      if (index === 0) result = str
      else if (str.startsWith('[')) result += str
      else result += `.${str}`
    })

    return result
  }
}
