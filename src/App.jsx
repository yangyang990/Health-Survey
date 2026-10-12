import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './AppContext'
import { Notifications, Spinner } from './components/Overlays'
import Admin from './pages/Admin'
import Form from './pages/Form'
import Result from './pages/Result'

function LanguageFromUrl() {
  const { setLanguage } = useApp()
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang')
    setLanguage(lang || 'en')
  }, [setLanguage])
  return null
}

export default function App() {
  return (
    <AppProvider>
      <div className="App">
        <LanguageFromUrl />
        <Spinner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Form />} />
            <Route path="/result" element={<Result />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Notifications />
        </BrowserRouter>
      </div>
    </AppProvider>
  )
}
