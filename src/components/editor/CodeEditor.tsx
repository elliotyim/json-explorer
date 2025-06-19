import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { JSONUtil } from '@/utils/json'
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  jsonString: string
  editorRef?: React.RefObject<editor.IStandaloneCodeEditor | null>
  readOnly?: boolean
  withButtons?: boolean
  onValueChange?: (value: string) => void
}

const CodeEditor: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  editorRef,
  jsonString,
  readOnly,
  withButtons,
  onValueChange,
  ...props
}) => {
  const [code, setCode] = useState<string>(jsonString)

  const handleApplying = useCallback(() => {
    if (onValueChange) onValueChange(code)
  }, [code, onValueChange])

  const handleValueChange = useCallback(
    (value?: string) => {
      value = value ?? ''
      setCode(value)
      if (!withButtons && onValueChange) onValueChange(value)
    },
    [onValueChange, withButtons],
  )

  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      if (editorRef) editorRef.current = editor
    },
    [editorRef],
  )

  useEffect(() => setCode(jsonString), [jsonString])

  return (
    <div {...props}>
      <div className="flex h-full flex-col gap-2 pb-1">
        <Card
          className="h-full overflow-auto p-0"
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Editor
            height="100%"
            value={code}
            defaultLanguage="json"
            options={{
              readOnly,
              minimap: { enabled: false },
              hideCursorInOverviewRuler: true,
              overviewRulerLanes: 0,
              overviewRulerBorder: false,
            }}
            onChange={handleValueChange}
            onMount={handleEditorDidMount}
          />
        </Card>

        {withButtons ? (
          <div className="flex w-full gap-2">
            <Button
              className="flex-1 cursor-pointer"
              disabled={!JSONUtil.isJsonValid(code)}
              onClick={handleApplying}
            >
              Apply
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              disabled={!JSONUtil.isJsonValid(code)}
              onClick={() => setCode(JSON.stringify(JSON.parse(code), null, 2))}
            >
              Prettify
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CodeEditor
