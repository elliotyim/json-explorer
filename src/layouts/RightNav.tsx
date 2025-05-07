import { json as jsonLang } from '@codemirror/lang-json'
import { vscodeLight } from '@uiw/codemirror-theme-vscode'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[] | undefined
  onValueChange: (value: string) => void
}

const RightNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  onValueChange,
  ...props
}) => {
  const [value, setValue] = useState<string>('')
  const onChange = (value: string) => {
    setValue(value)
    onValueChange(value)
  }

  useEffect(() => {
    setValue(JSON.stringify(json, null, 2))
  }, [json])

  return (
    <div {...props}>
      <CodeMirror
        className="h-full"
        value={value}
        height="100%"
        theme={vscodeLight}
        extensions={[jsonLang()]}
        onChange={onChange}
      />
    </div>
  )
}

export default RightNav
