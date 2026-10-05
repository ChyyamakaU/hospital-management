import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter lets us use <Link> and <Route> anywhere in the app. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)