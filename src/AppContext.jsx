import { createContext, useCallback, useContext, useRef, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('en')
  const [connecting, setConnecting] = useState(false)
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setNotifications((list) => list.filter((n) => n.id !== id))
  }, [])

  const notifyError = useCallback(
    (message) => {
      const id = nextId.current++
      setNotifications((list) => [...list, { id, message }])
      setTimeout(() => dismiss(id), 3000)
    },
    [dismiss],
  )

  return (
    <AppContext.Provider
      value={{ language, setLanguage, connecting, setConnecting, user, setUser, notifications, notifyError, dismiss }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
