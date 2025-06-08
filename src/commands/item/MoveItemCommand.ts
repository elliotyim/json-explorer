import { JSONUtil } from '@/utils/json'

interface MoveItemValue {
  selectedNodes: Data[]
  targetNode: Data
  targetIndex?: number // Only for the elements order in the target array
}

export class MoveItemCommand implements Command<JSONObj['type']> {
  prev: Record<string, unknown> | unknown[]
  value: MoveItemValue
  isReversible: boolean = true

  constructor(prev: JSONObj['type'], value: MoveItemValue) {
    this.prev = prev
    this.value = value
  }

  private getParentType(obj: JSONObj['type'], node: Data): Data['type'] {
    const parent = JSONUtil.getByPath(obj, node.parentPath)
    return JSONUtil.getType(parent)
  }

  private filterNodes(nodes: Data[], targetNode: Data) {
    const trailingParentIds = new Set(JSONUtil.getTrailingPaths(targetNode.id))
    const folders = new Set()

    const filteredNodes = [...nodes]
      .filter(
        (node) =>
          !(
            node.parentPath === targetNode.id &&
            this.getParentType(this.prev, node) === 'object'
          ),
      )
      .sort((a, b) => a.id.length - b.id.length)
      .filter((node) => !trailingParentIds.has(node.id)) // Remove improper folders
      .filter((node) => {
        if (node.type !== 'value') folders.add(node.id)
        return !folders.has(node.parentPath) // Remove subordinate items in selected folders
      })

    return filteredNodes
  }

  private sortNodes(nodes: Data[]) {
    const sortedNodes = [...nodes].sort((a, b) => {
      const parentIdA = a.parentPath
      const parentIdB = b.parentPath

      if (parentIdA.length > parentIdB.length) return 1
      if (parentIdA.length < parentIdB.length) return -1
      if (parentIdA.localeCompare(parentIdB) > 0) return 1
      if (parentIdA.localeCompare(parentIdB) < 0) return -1
      return a.id.localeCompare(b.id)
    })

    return sortedNodes
  }

  private relocateNodes(
    obj: JSONObj['type'],
    sourceNodes: Data[],
    destination: string,
    targetIndex: number,
  ): JSONObj['type'] | null {
    const target = JSONUtil.getByPath(obj, destination)
    if (!Array.isArray(target)) return null

    const start = target.length - sourceNodes.length
    const selectedNodes: { index: number; data: Data }[] = sourceNodes.map(
      (node, i) => {
        const type =
          this.getParentType(this.prev, node) === 'object' ? 'object' : 'value'
        const index = start + i
        const id = `${destination}[${start + i}]`
        const name = type === 'object' ? node.name : `${index}`
        const parentPath = destination
        const value = node.value

        const data = { id, name, parentPath, type: type as 'value', value }
        const source = { index, data }
        return source
      },
    )
    return JSONUtil.relocate(obj, targetIndex, selectedNodes)
  }

  execute(): Promise<JSONObj['type']> {
    let json = structuredClone(this.prev)
    const { selectedNodes, targetNode } = this.value

    let targetIndex = this.value.targetIndex ?? -1

    const filteredNodes = this.filterNodes(selectedNodes, targetNode)
    const sortedNodes = this.sortNodes(filteredNodes)

    sortedNodes.forEach((node) =>
      JSONUtil.copy({ obj: json, from: node.id, to: targetNode.id }),
    )

    let destination = targetNode.id

    const reversed = [...sortedNodes].reverse()
    reversed.forEach((node) => {
      const parent = JSONUtil.getByPath(json, node.parentPath)
      const lastKey = JSONUtil.getSplitPaths({ path: node.id }).at(-1)

      if (
        destination === node.parentPath &&
        lastKey != null &&
        +lastKey < targetIndex
      ) {
        targetIndex--
      }

      JSONUtil.remove(parent, node.id)

      if (this.getParentType(this.prev, node) === 'array') {
        destination = JSONUtil.adjustArrayPath(node.id, destination)
      }
    })

    if (targetNode.type === 'array') {
      const result = this.relocateNodes(
        json,
        sortedNodes,
        destination,
        targetIndex,
      )
      if (result) json = result
    }

    return new Promise((res) => res(json))
  }
  undo(): Promise<JSONObj['type']> {
    return new Promise((res) => res(structuredClone(this.prev)))
  }
}
