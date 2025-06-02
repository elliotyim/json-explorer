import { useCallback, useEffect, useState } from 'react'
import Layout from './layouts/Layout'
import NotSupported from './layouts/NotSupported'
import { useSearchTriggerStore } from './store/search'

const getWindowRect = () => {
  const { innerWidth, innerHeight } = window
  return new DOMRect(0, 0, innerWidth, innerHeight)
}

function App() {
  const [windowRect, setWindowRect] = useState<DOMRect>(getWindowRect())
  const { setIsSearchTriggered } = useSearchTriggerStore()

  const handleSearchTrigger = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchTriggered(true)
      }
    },
    [setIsSearchTriggered],
  )

  useEffect(() => {
    const handleResize = () => setWindowRect(getWindowRect())
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleSearchTrigger)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleSearchTrigger)
    }
  }, [handleSearchTrigger])

  return windowRect.width >= 1280 ? <Layout /> : <NotSupported />
}

export default App
