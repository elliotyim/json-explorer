import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { JSONUtil } from '@/utils/json'
import { useEffect, useState } from 'react'

import Editor from '@monaco-editor/react'

interface Props {
  jsonString: string
  readOnly?: boolean
  withButtons?: boolean
  onValueChange?: (value: string) => void
}

const CodeEditor: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  jsonString,
  readOnly,
  onValueChange,
  withButtons,
  ...props
}) => {
  const [code, setCode] = useState<string>(jsonString)

  const handleConfirm = () => {
    if (onValueChange) onValueChange(code)
  }

  const handleValueChange = (value?: string) => {
    if (value == null) value = ''
    setCode(value)
    if (!withButtons && onValueChange) onValueChange(value)
  }

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
          />
        </Card>

        {withButtons ? (
          <div className="flex w-full gap-2">
            <Button
              className="flex-1 cursor-pointer"
              disabled={!JSONUtil.isJsonValid(code)}
              onClick={handleConfirm}
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
