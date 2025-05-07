import { NodeModel } from '@minoru/react-dnd-treeview'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { TypeIcon } from '../ui/dnd-tree/TypeIcon'

interface Props {
  item: NodeModel<CustomData>
}

const GridCard: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  item,
  ...props
}) => {
  const truncate = (title: string) => {
    const len = 9
    if (title.length > len) return title.substring(0, len) + '..'
    return title
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeIcon node={item} isOpen={false} />
                <span>{truncate(item.text)}</span>
              </div>
            </div>
          </div>
        </CardTitle>
        <CardDescription>{item.data?.type}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="truncate">
          {JSON.stringify(item.data?.value, null, 1)}
        </div>
      </CardContent>
    </Card>
  )
}

export default GridCard
