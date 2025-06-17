import { createRoot } from 'react-dom/client'
import 'react-virtualized/styles.css'
import App from './App.tsx'
import './index.css'
import './monaco.ts'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
  </>,
)
