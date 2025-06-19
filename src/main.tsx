import App from '@/App.tsx'
import '@/index.css'
import '@/monaco.ts'
import { createRoot } from 'react-dom/client'
import 'react-virtualized/styles.css'

createRoot(document.getElementById('root')!).render(<App />)
