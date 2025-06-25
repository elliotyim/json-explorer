import DragSelection from '@/components/dnd/DragSelection'
import GridCard from '@/components/dnd/grid/GridCard'
import { ITEM } from '@/constants/item'
import { MOUSE_CLICK } from '@/constants/mouse'
import { TAB } from '@/constants/tab'
import { useItemAction } from '@/hooks/useItemAction'
import { useKeyboardAction } from '@/hooks/useKeyboardAction'
import {
  useContainerStore,
  useMainContainerStore,
  useScrollContainerStore,
} from '@/store/container'
import { useContextMenuOpenStore } from '@/store/contextmenu'
import {
  useCurrentItemStore,
  useDraggingItemStore,
  useExtraItemIdsStore,
  useItemAreaStore,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useInitialFocus } from '@/store/settings'
import { useRightNavTabStore } from '@/store/tab'
import { useTreeRefStore } from '@/store/tree'
import { DOMUtil } from '@/utils/dom'
import { JSONUtil } from '@/utils/json'
import { MathUtil } from '@/utils/math'
import _ from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AutoSizer, Grid, GridCellProps } from 'react-virtualized'

interface Props {
  items: Data[]
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  ...props
}) => {
  const { isAppReady } = useInitialFocus()
  const { treeRef } = useTreeRefStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { isContextOpen } = useContextMenuOpenStore()

  const { isContainerReady, setIsContainerReady } = useContainerStore()
  const { container, setContainer } = useMainContainerStore()
  const { scrollContainer, setScrollContainer } = useScrollContainerStore()

  const { json } = useJsonStore()
  const { currentItem } = useCurrentItemStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { extraItemIds, setExtraItemIds } = useExtraItemIdsStore()
  const { itemAreas, setItemAreas } = useItemAreaStore()
  const draggingItemId = useDraggingItemStore((state) => state.draggingItemId)

  const { focusedItemRef, onKeyDown, onKeyUp } = useKeyboardAction()
  const { enterItem, moveItems } = useItemAction()

  const outerContainerRef = useRef<HTMLDivElement>(null)
  const shiftIndex = useRef<number | null>(null)

  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [enabled, setEnabled] = useState<boolean>(false)

  const [isFocusDone, setIsFocusDone] = useState<boolean>(false)

  const [draggingItems, setDraggingItems] = useState<Record<string, boolean>>(
    {},
  )

  const onItemRelocation = useCallback(
    async (targetIndex: number) => {
      const selectedNodes = items.filter(
        (item) =>
          selectedItemIds[item.id] ||
          extraItemIds[item.id] ||
          draggingItems[item.id],
      )

      if (!selectedNodes.length) return

      const targetNode = JSONUtil.inspect(json, selectedNodes[0].parentPath)
      await moveItems(selectedNodes, targetNode, targetIndex)
    },
    [draggingItems, extraItemIds, moveItems, items, json, selectedItemIds],
  )

  const onItemMove = useCallback(
    async (source: HTMLElement, target: HTMLElement, targetIndex?: number) => {
      const selectedNodes = items.filter(
        (item) =>
          selectedItemIds[item.id] ||
          extraItemIds[item.id] ||
          draggingItems[item.id],
      )

      if (!selectedNodes.length) return

      const sourceId = source.dataset.item
      const targetId = target.dataset.item

      const wrongTarget = selectedNodes.filter(
        (node) => node.id !== sourceId && node.id === targetId,
      ).length

      if (wrongTarget || sourceId == null || targetId == null) return

      const targetNode = JSONUtil.inspect(json, targetId)

      await moveItems(selectedNodes, targetNode, targetIndex)
    },
    [draggingItems, extraItemIds, moveItems, items, json, selectedItemIds],
  )

  const onDropItemEnd = useCallback(() => setDraggingItems({}), [])

  const cellRenderer = useCallback(
    ({ columnIndex, rowIndex, style, parent }: GridCellProps) => {
      const width = parent.props.width
      const i = MathUtil.countColumn(width) * rowIndex + columnIndex
      const item = items[i]

      return item ? (
        <GridCard
          key={item.id}
          item={item}
          index={i}
          isSelected={
            !!selectedItemIds[item.id] ||
            !!extraItemIds[item.id] ||
            !!draggingItems[item.id]
          }
          isFocused={focusedItemRef.current === item.id}
          style={style}
          onDropEnd={onDropItemEnd}
          onItemMove={onItemMove}
          onItemRelocation={onItemRelocation}
        />
      ) : null
    },
    [
      draggingItems,
      extraItemIds,
      focusedItemRef,
      onItemMove,
      onItemRelocation,
      items,
      onDropItemEnd,
      selectedItemIds,
    ],
  )

  useEffect(() => {
    if (isAppReady && !isFocusDone && outerContainerRef) {
      outerContainerRef.current?.focus()
      setIsFocusDone(true)
    }
  }, [isAppReady, isFocusDone])

  useEffect(() => {
    setSelectedItemIds({})
    setExtraItemIds({})
  }, [currentItem.id, setExtraItemIds, setSelectedItemIds])

  useEffect(() => {
    const areas: Record<string, DOMRect> = {}

    items.forEach((item, index) => {
      const columnIndex = index % MathUtil.countColumn(containerWidth)
      const rowIndex = Math.floor(index / MathUtil.countColumn(containerWidth))
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
        className="relative h-full w-full overflow-hidden"
        onFocus={() => setEnabled(true)}
        onBlur={() => setEnabled(false)}
        onClick={(e) => {
          const clickCount = e.detail
          if (clickCount === 2) {
            const itemIds = Object.keys(selectedItemIds)
            if (itemIds.length === 1) {
              const paths = JSONUtil.getTrailingPaths(itemIds[0])
              paths.forEach((path) => treeRef.current?.open(path))
              const item = JSONUtil.inspect(json, itemIds[0])
              if (item.type === 'value') setRightNavTab(TAB.PROPERTIES)
              else enterItem(itemIds[0])
            }
          }
        }}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        {...props}
      >
        <AutoSizer
          onResize={({ width }) => {
            setContainerWidth(width)
            const handle = requestAnimationFrame(() => {
              const container = outerContainerRef.current
              setContainer(container)
              setScrollContainer(DOMUtil.getNthFirstChild(container, 2))
              setIsContainerReady(true)
              cancelAnimationFrame(handle)
            })
          }}
        >
          {({ height, width }) => (
            <Grid
              width={width}
              height={height}
              columnWidth={ITEM.SIZE + ITEM.GAP_SIZE * 2}
              rowHeight={ITEM.SIZE + ITEM.GAP_SIZE * 2}
              rowCount={Math.ceil(items.length / MathUtil.countColumn(width))}
              columnCount={MathUtil.countColumn(width)}
              cellRenderer={cellRenderer}
              containerStyle={{ width, minWidth: width, minHeight: height }}
              overscanRowCount={2}
              overscanColumnCount={2}
            />
          )}
        </AutoSizer>

        <DragSelection
          container={container}
          scrollContainer={scrollContainer}
          isContainerReady={isContainerReady}
          enabled={enabled}
          onSelectionStart={({ event: e, x, y, scrollX, scrollY }) => {
            const selectedPoint = new DOMRect(x + scrollX, y + scrollY, 0, 0)
            const newItem = DOMUtil.getItems(selectedPoint, itemAreas)
            const anyItemClicked = Object.keys(newItem).length > 0

            if (anyItemClicked) {
              if (e.ctrlKey || e.metaKey) {
                setExtraItemIds((prev) => ({ ...prev, ...newItem }))
              } else {
                if (e.shiftKey) {
                  if (shiftIndex.current == null) {
                    const indexes: number[] = []
                    items.forEach((item, index) => {
                      if (selectedItemIds[item.id]) indexes.push(index)
                    })
                    indexes.sort()
                    if (indexes.length) shiftIndex.current = indexes[0]
                  }
                  if (shiftIndex.current != null) {
                    const id = Object.keys(newItem)[0]
                    const nextIndex = items.findIndex((item) => item.id == id)
                    const start = Math.min(shiftIndex.current, nextIndex)
                    const end = Math.max(shiftIndex.current, nextIndex)
                    const extraIds = items
                      .slice(start, end + 1)
                      .map((node) => node.id)
                    extraIds.forEach((id) => (newItem[id] = true))
                  }
                }
                if (Object.keys(selectedItemIds).length > 1) {
                  setDraggingItems(structuredClone(selectedItemIds))
                }
                setSelectedItemIds({ ...newItem })
              }
            }

            return anyItemClicked
          }}
          onSelectionChange={({ event: e, selectionArea }) => {
            const newItem = DOMUtil.getItems(selectionArea, itemAreas)
            if (e.ctrlKey || e.metaKey) {
              setExtraItemIds(newItem)
            } else if (!_.isEqual(selectedItemIds, newItem)) {
              setSelectedItemIds(newItem)
            }
          }}
          onSelectionEnd={({ event: e, selectionArea }) => {
            if (!e.shiftKey) shiftIndex.current = null

            const point = new DOMRect(e.x, e.y, 0, 0)
            const containerRect =
              outerContainerRef.current?.getBoundingClientRect()
            if (!containerRect) return

            const isPointerInside = DOMUtil.intersect(point, containerRect)
            if (!isPointerInside) return

            const newItem = DOMUtil.getItems(selectionArea, itemAreas)

            const handle = requestAnimationFrame(() => {
              if (e.button === MOUSE_CLICK.RIGHT) {
                setSelectedItemIds((prev) => ({ ...prev, ...newItem }))
                return
              }

              const toBeRemoved = new Set()
              Object.keys(newItem).forEach((id) => {
                if (selectedItemIds[id]) toBeRemoved.add(id)
              })

              const isClick =
                selectionArea.width == 0 && selectionArea.height == 0

              if (isClick) {
                if (draggingItemId == null && !e.shiftKey) {
                  const itemId = Object.keys(newItem)[0]
                  if (selectedItemIds[itemId]) {
                    if (e.ctrlKey) {
                      delete extraItemIds[itemId]
                      delete selectedItemIds[itemId]
                      setExtraItemIds({ ...extraItemIds })
                      setSelectedItemIds({ ...selectedItemIds })
                    } else {
                      setExtraItemIds({})
                      setSelectedItemIds(newItem)
                    }
                  } else if (!e.ctrlKey && !isContextOpen) {
                    setExtraItemIds({})
                    setSelectedItemIds(newItem)
                  }
                }
              } else if (!e.ctrlKey && !isContextOpen) {
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
