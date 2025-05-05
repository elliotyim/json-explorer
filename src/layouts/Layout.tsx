import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useState } from 'react'

import { useDebouncedCallback } from 'use-debounce'

const Layout = () => {
  const [json, setJson] = useState<
    Record<string, unknown> | unknown[] | undefined
  >()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDrop = (newJson: Record<string, unknown> | unknown[]) => {
    setJson(newJson)
  }

  const debouncedValueChange = useDebouncedCallback((value) => {
    if (!value) return

    try {
      setJson(JSON.parse(value))
      setErrorMessage(null)
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        setErrorMessage('JSON input is not valid!')
      } else {
        throw e
      }
    }
  }, 1000)

  return (
    <div className="flex h-screen w-full">
      <LeftNav
        className="w-2/12 overflow-y-auto"
        json={json}
        errorMessage={errorMessage}
        onItemDrop={handleDrop}
      />
      <MainContent className="w-7/12 border-x border-slate-300 bg-green-300" />
      <RightNav
        className="flex h-full w-3/12 flex-col bg-[#1e1e1e]"
        json={json}
        onValueChange={(value) => debouncedValueChange(value)}
      />
    </div>
  )
}

export default Layout
