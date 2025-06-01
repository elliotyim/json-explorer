import { useEffect, useState } from 'react'
import Layout from './layouts/Layout'
import NotSupported from './layouts/NotSupported'

const getWindowRect = () => {
  const { innerWidth, innerHeight } = window
  return new DOMRect(0, 0, innerWidth, innerHeight)
}

function App() {
  const [windowRect, setWindowRect] = useState<DOMRect>(getWindowRect())
  useEffect(() => {
    const handleResize = () => setWindowRect(getWindowRect())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowRect.width >= 1280 ? <Layout /> : <NotSupported />
}

export default App
