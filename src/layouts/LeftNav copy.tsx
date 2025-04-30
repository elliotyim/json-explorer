import { JSONUtil } from '@/utils/json'
import { useEffect, useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa6'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'

import json from '@/fixtures/sample.json'

interface MenuItem {
  id: string
  title: string
  isOpen?: boolean
  children?: MenuItem[]
}

const initialMenu: MenuItem[] = [
  {
    id: '1',
    title: 'Dashboard',
    isOpen: false,
    children: [
      { id: '1-1', title: 'Analytics', isOpen: false },
      { id: '1-2', title: 'Reports', isOpen: false },
    ],
  },
  {
    id: '2',
    title: 'Settings',
    isOpen: false,
    children: [
      { id: '2-1', title: 'Profile', isOpen: false },
      { id: '2-2', title: 'Security', isOpen: false },
    ],
  },
]

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  // const [items, setItems] = useState<JSONItem[]>([])
  // const [input] = useState(json)

  // useEffect(() => {
  //   const convertedItems = JSONUtil.convert({ input })
  //   setItems(convertedItems)
  // }, [input, setItems])

  // const toggleItem = (items: JSONItem[], targetPath: string): JSONItem[] => {
  //   return items.map((item) => {
  //     if (item.path === targetPath) {
  //       return { ...item, isOpen: !item.isOpen }
  //     }
  //     if (item.children) {
  //       return { ...item, children: toggleItem(item.children, targetPath) }
  //     }
  //     return item
  //   })
  // }

  // const onDragEnd = (result: DropResult) => {
  //   const { source, destination } = result

  //   if (!destination) return

  //   const items = Array.from(menu)
  //   const [removed] = items.splice(source.index, 1)
  //   items.splice(destination.index, 0, removed)

  //   setItem(items)
  // }

  // const renderMenu = (items: JSONItem[], level: number = 0) => {
  //   return (
  //     <ul>
  //       {items.map((item) => (
  //         <li key={item.path}>
  //           <div className="flex cursor-pointer items-center justify-between rounded px-4 py-2 hover:bg-gray-100">
  //             <span className="flex min-h-8 items-center">{item.name}</span>
  //             {item.children && (
  //               <span
  //                 className="p-2 text-sm text-gray-500"
  //                 onClick={() =>
  //                   setItems((prev) => toggleItem(prev, item.path))
  //                 }
  //               >
  //                 {item.isOpen ? <FaChevronUp /> : <FaChevronDown />}
  //               </span>
  //             )}
  //           </div>
  //           {item.children &&
  //             item.isOpen &&
  //             renderMenu(item.children, level + 1)}
  //         </li>
  //       ))}
  //     </ul>
  //   )
  // }

  // return <div {...props}>{renderMenu(items)}</div>
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu)

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return

    const items = [...menu]
    const [removed] = items.splice(source.index, 1)
    items.splice(destination.index, 0, removed)

    setMenu(items)
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="menu">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {menu.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="mb-2 rounded bg-white p-4 shadow hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.children && (
                          <span className="text-sm text-gray-500">
                            {item.isOpen ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      {item.children && item.isOpen && (
                        <ul className="mt-2 space-y-1 pl-4">
                          {item.children.map((child) => (
                            <li
                              key={child.id}
                              className="text-sm text-gray-600"
                            >
                              {child.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default LeftNav
