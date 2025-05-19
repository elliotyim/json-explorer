import { Card } from '@/components/ui/card'
import { json as jsonLang } from '@codemirror/lang-json'
import { vscodeLight } from '@uiw/codemirror-theme-vscode'
import CodeMirror from '@uiw/react-codemirror'

interface Props {
  jsonString: string
  onValueChange?: (value: string) => void
}

const CodeEditor: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  jsonString,
  onValueChange,
  ...props
}) => {
  const onChange = (value: string) => {
    if (onValueChange) onValueChange(value)
  }

  return (
    <div {...props}>
      <Card className="h-full p-1">
        <CodeMirror
          className="h-full"
          value={jsonString}
          height="100%"
          theme={vscodeLight}
          extensions={[jsonLang()]}
          onChange={onChange}
        />
      </Card>
    </div>
  )
}

export default CodeEditor
