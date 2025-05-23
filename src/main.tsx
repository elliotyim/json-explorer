import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'react-virtualized/styles.css'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <>
    <BrowserRouter></BrowserRouter>
    <App />
  </>,
)
