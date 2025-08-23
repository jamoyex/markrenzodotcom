import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminApp from './admin/AdminApp'
import './index.css'
 
const root = document.getElementById('root')!
const path = window.location.pathname

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {path.startsWith('/admin') ? <AdminApp /> : <App />}
  </React.StrictMode>,
)