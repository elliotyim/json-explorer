import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { createRoot } from 'react-dom/client'
import 'react-virtualized/styles.css'
import App from './App.tsx'
import './index.css'
import './userWorker.ts'

loader.config({ monaco })

createRoot(document.getElementById('root')!).render(
  <>
    <App />
  </>,
)
