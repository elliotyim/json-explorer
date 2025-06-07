import CodeEditor from '@/components/code-editor/CodeEditor'
import Properties from '@/components/right-nav/Properties'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TAB } from '@/constants/tab'
import { useRightNavTabStore } from '@/store/tab'

interface Props {
  json: Record<string, unknown> | unknown[]
  onValueChange: (value: string) => void
}

const RightNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  onValueChange,
  ...props
}) => {
  const { rightNavTab, setRightNavTab } = useRightNavTabStore()

  return (
    <div {...props} tabIndex={-1}>
      <Tabs
        className="h-full p-2"
        value={rightNavTab ?? TAB.JSON}
        onValueChange={(val) => setRightNavTab(val)}
      >
        <TabsList className="grid w-full grid-cols-2 select-none">
          <TabsTrigger value={TAB.JSON} className="cursor-pointer">
            JSON
          </TabsTrigger>
          <TabsTrigger value={TAB.PROPERTIES} className="cursor-pointer">
            Properties
          </TabsTrigger>
        </TabsList>
        <TabsContent
          tabIndex={-1}
          value={TAB.JSON}
          className="h-full overflow-auto"
        >
          <CodeEditor
            jsonString={JSON.stringify(json, null, 2)}
            onValueChange={onValueChange}
            className="h-full"
            withButtons
          />
        </TabsContent>
        <TabsContent
          tabIndex={-1}
          value={TAB.PROPERTIES}
          className="h-full overflow-auto"
        >
          <Properties />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RightNav
