import { useCallback, useEffect, useState } from 'react'
import Layout from './layouts/Layout'
import NotSupported from './layouts/NotSupported'
import { useSearchTriggerStore } from './store/search'
import { useInitialFocus } from './store/settings'

const getWindowRect = () => {
  const { innerWidth, innerHeight } = window
  return new DOMRect(0, 0, innerWidth, innerHeight)
}

function App() {
  const [windowRect, setWindowRect] = useState<DOMRect>(getWindowRect())
  const { setIsSearchTriggered } = useSearchTriggerStore()
  const { setIsAppReady } = useInitialFocus()

  const handleResize = useCallback(() => setWindowRect(getWindowRect()), [])

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
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleSearchTrigger)

    setIsAppReady(true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleSearchTrigger)
    }
  }, [handleResize, handleSearchTrigger, setIsAppReady])

  return windowRect.width >= 1024 ? <Layout /> : <NotSupported />
}

export default App
