import { useApp } from '../AppContext'

export function Spinner() {
  const { connecting } = useApp()
  if (!connecting) return null
  return (
    <div className="spinnerOverlay">
      <div className="spinnerCircle" />
    </div>
  )
}

export function Notifications() {
  const { notifications, dismiss } = useApp()
  return (
    <div className="notificationContainer">
      {notifications.map((n) => (
        <div key={n.id} className="notificationError" onClick={() => dismiss(n.id)}>
          {n.message}
        </div>
      ))}
    </div>
  )
}
