import { json as jsonLang } from '@codemirror/lang-json'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import CodeMirror from '@uiw/react-codemirror'
import { useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[] | undefined
  onValueChange: (value: string) => void
}

const RightNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  onValueChange,
  ...props
}) => {
  const [value, setValue] = useState(JSON.stringify(json, null, 2))
  const onChange = (value: string) => {
    setValue(value)
    onValueChange(value)
  }

  return (
    <div {...props}>
      <CodeMirror
        className="h-full"
        value={value}
        height="100%"
        theme={vscodeDark}
        extensions={[jsonLang()]}
        onChange={onChange}
      />
    </div>
  )
}

export default RightNav
