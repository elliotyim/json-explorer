import { ReplaceJSONCommand } from '@/commands/json/ReplaceJSONCommand'
import CodeEditor from '@/components/code-editor/CodeEditor'
import Properties from '@/components/right-nav/Properties'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TAB } from '@/constants/tab'
import { useCommandStore } from '@/store/command'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'

interface Props {
  json: Record<string, unknown> | unknown[]
}

const RightNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  ...props
}) => {
  const { rightNavTab, setRightNavTab } = useRightNavTabStore()

  const { setJson } = useJsonStore()
  const { execute } = useCommandStore()

  const handleJSONChange = async (code: string) => {
    const command = new ReplaceJSONCommand(
      structuredClone(json),
      JSON.parse(code),
    )
    const result = await execute(command)
    setJson(result)
  }

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
            onValueChange={handleJSONChange}
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
