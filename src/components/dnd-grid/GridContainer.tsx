import { ITEM } from '@/constants/item'
import { TAB } from '@/constants/tab'
import {
  useDraggingItemStore,
  useExtraItemIdsStore,
  useItemAreaStore,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { DOMUtil } from '@/utils/dom'
import { JSONUtil } from '@/utils/json'
import { useEffect, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AutoSizer, Grid, GridCellProps } from 'react-virtualized'
import DragSelection from '../DragSelection'
import GridCard from './GridCard'

interface Props {
  items: Data[]
  currentItemId: string
  onItemRelocation?: (
    targetIndex: number,
    selectedNodes: {
      index: number
      item: Data
    }[],
  ) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: Data[],
    targetIndex?: number,
  ) => void
  onItemEnter?: (itemId: string) => void
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  currentItemId,
  onItemRelocation,
  onItemMove,
  onItemEnter,
  ...props
}) => {
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { setRightNavTab } = useRightNavTabStore()

  const { json, setJson } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { extraItemIds, setExtraItemIds } = useExtraItemIdsStore()

  const { draggingItemId } = useDraggingItemStore()
  const [draggingItems, setDraggingItems] = useState<Record<string, boolean>>(
    {},
  )

  const [pushedKeys, setPushedKeys] = useState<Record<string, boolean>>({})
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const [isReady, setIsReady] = useState<boolean>(false)

  const { itemAreas, setItemAreas } = useItemAreaStore()

  const handleItemRelocation = (targetIndex: number) => {
    if (onItemRelocation) {
      const selectedNodes = []
      for (const [index, item] of items.entries()) {
        if (
          selectedItemIds[item.id] ||
          extraItemIds[item.id] ||
          draggingItems[item.id]
        ) {
          selectedNodes.push({ index, item })
        }
      }
      onItemRelocation(targetIndex, selectedNodes)
      setSelectedItemIds({})
      setExtraItemIds({})
    }
  }

  const handleItemMove = (
    source: HTMLElement,
    target: HTMLElement,
    targetIndex?: number,
  ) => {
    if (onItemMove) {
      const selectedNodes = items.filter(
        (item) =>
          selectedItemIds[item.id] ||
          extraItemIds[item.id] ||
          draggingItems[item.id],
      )
      onItemMove(source, target, selectedNodes, targetIndex)
      setSelectedItemIds({})
      setExtraItemIds({})
    }
  }

  const columnCount = (width: number) =>
    Math.floor(width / (ITEM.SIZE + ITEM.GAP_SIZE * 2))

  const cellRenderer = ({
    columnIndex,
    rowIndex,
    style,
    parent,
  }: GridCellProps) => {
    const index = columnCount(parent.props.width) * rowIndex + columnIndex
    const item = items[index]

    return item ? (
      <GridCard
        item={item}
        index={index}
        selectedItemIds={selectedItemIds}
        extraItemIds={extraItemIds}
        draggingItems={draggingItems}
        style={style}
        onDropEnd={() => setDraggingItems({})}
        onItemMove={handleItemMove}
        onItemRelocation={handleItemRelocation}
      />
    ) : null
  }

  useEffect(() => {
    setSelectedItemIds({})
    setExtraItemIds({})
  }, [currentItemId, setExtraItemIds, setSelectedItemIds])

  useEffect(() => {
    const areas: Record<string, DOMRect> = {}

    items.forEach((item, index) => {
      const columnIndex = index % columnCount(containerWidth)
      const rowIndex = Math.floor(index / columnCount(containerWidth))
      const x = ITEM.GAP_SIZE + columnIndex * (ITEM.SIZE + ITEM.GAP_SIZE * 2)
      const y = ITEM.GAP_SIZE + rowIndex * (ITEM.SIZE + ITEM.GAP_SIZE * 2)
      areas[item.id] = new DOMRect(x, y, ITEM.SIZE, ITEM.SIZE)
    })

    setItemAreas(areas)
  }, [containerWidth, items, setItemAreas])

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={outerContainerRef}
        className="h-full w-full"
        onClick={(e) => {
          const clickCount = e.detail
          if (clickCount === 2) {
            const itemIds = Object.keys(selectedItemIds)
            if (itemIds.length === 1 && onItemEnter) {
              const item = JSONUtil.inspect({ obj: json, path: itemIds[0] })
              if (item.type === 'value') setRightNavTab(TAB.PROPERTIES)
              else onItemEnter(itemIds[0])
            }
          }
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.ctrlKey) {
            if (e.key === 'a') {
              e.preventDefault()
              if (Object.keys(selectedItemIds).length !== items.length) {
                const allSelectedItems: Record<string, boolean> = {}
                items.forEach((item) => (allSelectedItems[item.id] = true))
                setSelectedItemIds(allSelectedItems)
              }
            } else if (e.key === 'c') {
              JSONUtil.copyItems(json, Object.keys(selectedItemIds))
            } else if (e.key === 'v') {
              const result = JSONUtil.pastItems(json, currentItemId)
              setJson(result)
            } else if (e.key === 'x') {
              const itemIds = Object.keys(selectedItemIds)
              const result = JSONUtil.cutItems(json, itemIds)
              setJson(result)
              setSelectedItemIds({})
            }
          }

          if (e.key === 'Escape') {
            e.preventDefault()
            setSelectedItemIds({})
          } else if (!pushedKeys[e.key]) {
            setPushedKeys((prev) => ({ ...prev, [e.key]: true }))
          }
        }}
        onKeyUp={(e) => {
          delete pushedKeys[e.key]
          setPushedKeys({ ...pushedKeys })
        }}
        {...props}
      >
        <AutoSizer
          onResize={({ width }) => {
            setContainerWidth(width)

            if (!scrollContainerRef.current) {
              const id = requestAnimationFrame(() => {
                scrollContainerRef.current = DOMUtil.getNthFirstChild(
                  outerContainerRef.current,
                  2,
                ) as HTMLDivElement
                setIsReady(true)
                cancelAnimationFrame(id)
              })
            }
          }}
        >
          {({ height, width }) => (
            <Grid
              width={width}
              height={height}
              columnWidth={ITEM.SIZE + ITEM.GAP_SIZE * 2}
              rowHeight={ITEM.SIZE + ITEM.GAP_SIZE * 2}
              rowCount={Math.ceil(items.length / columnCount(width))}
              columnCount={columnCount(width)}
              cellRenderer={cellRenderer}
              containerStyle={{ width, minWidth: width, minHeight: height }}
            />
          )}
        </AutoSizer>

        <DragSelection
          containerRef={outerContainerRef}
          scrollRef={scrollContainerRef}
          isReady={isReady}
          onSelectionStart={({ event: e, x, y, scrollX, scrollY }) => {
            const selectedPoint = new DOMRect(x + scrollX, y + scrollY, 0, 0)
            const newItem = DOMUtil.getItems(selectedPoint, itemAreas)
            const anyItemClicked = Object.keys(newItem).length > 0

            if (anyItemClicked) {
              if (e.ctrlKey || e.metaKey) {
                setExtraItemIds((prev) => ({ ...prev, ...newItem }))
              } else {
                if (Object.keys(selectedItemIds).length > 1) {
                  setDraggingItems(structuredClone(selectedItemIds))
                }
                setSelectedItemIds({ ...newItem })
              }
            }

            return anyItemClicked
          }}
          onSelectionChange={({ event, selectionArea }) => {
            const newItem = DOMUtil.getItems(selectionArea, itemAreas)
            const handle = requestAnimationFrame(() => {
              if (event.ctrlKey || event.metaKey) setExtraItemIds(newItem)
              else setSelectedItemIds(newItem)
              cancelAnimationFrame(handle)
            })
          }}
          onSelectionEnd={({ event, selectionArea }) => {
            const newItem = DOMUtil.getItems(selectionArea, itemAreas)

            const handle = requestAnimationFrame(() => {
              const toBeRemoved = new Set()
              Object.keys(newItem).forEach((id) => {
                if (selectedItemIds[id]) toBeRemoved.add(id)
              })

              const isClick =
                selectionArea.width == 0 && selectionArea.height == 0

              if (isClick) {
                if (draggingItemId == null) {
                  const itemId = Object.keys(newItem)[0]
                  if (selectedItemIds[itemId]) {
                    if (event.ctrlKey) {
                      delete extraItemIds[itemId]
                      delete selectedItemIds[itemId]
                      setExtraItemIds({ ...extraItemIds })
                      setSelectedItemIds({ ...selectedItemIds })
                    } else {
                      setExtraItemIds({})
                      setSelectedItemIds(newItem)
                    }
                  } else if (!event.ctrlKey) {
                    setExtraItemIds({})
                    setSelectedItemIds(newItem)
                  }
                }
              } else if (!event.ctrlKey) {
                setExtraItemIds({})
                setSelectedItemIds(newItem)
              }

              if (Object.keys(extraItemIds).length) {
                setSelectedItemIds((prev) => ({ ...prev, ...extraItemIds }))
                setExtraItemIds({})
              }

              setDraggingItems({})
              cancelAnimationFrame(handle)
            })
          }}
        />
      </div>
    </DndProvider>
  )
}

export default GridContainer
