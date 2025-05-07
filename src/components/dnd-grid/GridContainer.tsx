import { NodeModel } from '@minoru/react-dnd-treeview'
import GridCard from './GridCard'
import { useState } from 'react'
import { DOMVector } from '@/utils/dom'

interface Props {
  items: NodeModel<CustomData>[]
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  ...props
}) => {
  const [dragVector, setDrgVector] = useState<DOMVector | null>(null)
  const selectionRect = dragVector ? dragVector.toDOMRect() : null

  return (
    <div
      className="relative z-0 h-full gap-4 p-4"
      onPointerDown={(e) => {
        if (e.button !== 0) return

        const containerRect = e.currentTarget.getBoundingClientRect()

        setDrgVector(
          new DOMVector(
            e.clientX - containerRect.x,
            e.clientY - containerRect.y,
            0,
            0,
          ),
        )
      }}
      onPointerMove={(e) => {
        if (selectionRect === null || dragVector === null) return

        const containerRect = e.currentTarget.getBoundingClientRect()

        const nextDragVector = new DOMVector(
          dragVector.x,
          dragVector.y,
          e.clientX - containerRect.x - dragVector.x,
          e.clientY - containerRect.y - dragVector.y,
        )

        setDrgVector(nextDragVector)
      }}
      onPointerUp={() => {
        setDrgVector(null)
      }}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-4">
        {items.map((item) => (
          <GridCard
            key={item.id}
            item={item}
            className="h-[150px] w-[150px] cursor-pointer select-none"
          />
        ))}
        {selectionRect && (
          <div
            className="absolute border-2 border-black bg-black/30"
            style={{
              top: selectionRect.y,
              left: selectionRect.x,
              width: selectionRect.width,
              height: selectionRect.height,
            }}
          />
        )}
      </div>
    </div>
  )
}

export default GridContainer
