import DragSelection from '@/components/DragSelection'
import GridCard from '@/components/dnd-grid/GridCard'
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
  useDraggingItemStore,
  useExtraItemIdsStore,
  useItemAreaStore,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useInitialFocus } from '@/store/settings'
import { useRightNavTabStore } from '@/store/tab'
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
  currentItemId: string
  onItemRelocation?: (targetIndex: number, selectedNodes: Data[]) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: Data[],
    targetIndex?: number,
  ) => void
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  currentItemId,
  onItemRelocation,
  onItemMove,
  ...props
}) => {
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const shiftIndex = useRef<number | null>(null)

  const { isContainerReady, setIsContainerReady } = useContainerStore()
  const { container, setContainer } = useMainContainerStore()
  const { scrollContainer, setScrollContainer } = useScrollContainerStore()

  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [enabled, setEnabled] = useState<boolean>(false)

  const [isFocusDone, setIsFocusDone] = useState<boolean>(false)

  const { isAppReady } = useInitialFocus()
  const { setRightNavTab } = useRightNavTabStore()
  const { isContextOpen } = useContextMenuOpenStore()

  const { json } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { extraItemIds, setExtraItemIds } = useExtraItemIdsStore()
  const { itemAreas, setItemAreas } = useItemAreaStore()

  const { draggingItemId } = useDraggingItemStore()
  const [draggingItems, setDraggingItems] = useState<Record<string, boolean>>(
    {},
  )

  const { focusedItemRef, onKeyDown, onKeyUp } = useKeyboardAction()
  const { enterItem } = useItemAction()

  const handleItemRelocation = useCallback(
    (targetIndex: number) => {
      if (onItemRelocation) {
        const selectedNodes = items.filter(
          (item) =>
            selectedItemIds[item.id] ||
            extraItemIds[item.id] ||
            draggingItems[item.id],
        )
        onItemRelocation(targetIndex, selectedNodes)
        setSelectedItemIds({})
        setExtraItemIds({})
      }
    },
    [
      draggingItems,
      extraItemIds,
      items,
      onItemRelocation,
      selectedItemIds,
      setExtraItemIds,
      setSelectedItemIds,
    ],
  )

  const handleItemMove = useCallback(
    (source: HTMLElement, target: HTMLElement, targetIndex?: number) => {
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
    },
    [
      draggingItems,
      extraItemIds,
      items,
      onItemMove,
      selectedItemIds,
      setExtraItemIds,
      setSelectedItemIds,
    ],
  )

  const onDropItemEnd = useCallback(() => setDraggingItems({}), [])

  const cellRenderer = useCallback(
    ({ columnIndex, rowIndex, style, parent }: GridCellProps) => {
      const i =
        MathUtil.countColumn(parent.props.width) * rowIndex + columnIndex
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
          onItemMove={handleItemMove}
          onItemRelocation={handleItemRelocation}
        />
      ) : null
    },
    [
      draggingItems,
      extraItemIds,
      focusedItemRef,
      handleItemMove,
      handleItemRelocation,
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
  }, [currentItemId, setExtraItemIds, setSelectedItemIds])

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
        className="h-full w-full overflow-hidden"
        onFocus={() => setEnabled(true)}
        onBlur={() => setEnabled(false)}
        onClick={(e) => {
          const clickCount = e.detail
          if (clickCount === 2) {
            const itemIds = Object.keys(selectedItemIds)
            if (itemIds.length === 1) {
              const item = JSONUtil.inspect({ obj: json, path: itemIds[0] })
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
