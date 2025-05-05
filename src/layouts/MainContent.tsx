import { JSONUtil } from '@/utils/json'
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[] | undefined
  selectedItemId?: string
}

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  selectedItemId,
  ...props
}) => {
  const [displayItems, setDisplayItems] = useState<NodeModel<CustomData>[]>([])
  const [selectedItem, setSelectedItem] = useState<unknown>({})

  useEffect(() => {
    if (!selectedItemId) return
    const obj = JSONUtil.getByPath(json, selectedItemId)
    const data = JSONUtil.flatten({
      input: obj,
      parentPath: selectedItemId,
      depth: 1,
    })

    setSelectedItem(obj)
    setDisplayItems(data)
  }, [json, selectedItemId])

  return (
    <div {...props}>
      <div className="p-4">
        <div>targetObj: {JSON.stringify(selectedItem)}</div>
        <hr className="my-4" />
        {displayItems.map((item) => (
          <div key={item.id}>
            <div>
              text: {item.text} | id: {item.id} | parent: {item.parent} | type:{' '}
              {item.data?.type} | value: {JSON.stringify(item.data?.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MainContent
