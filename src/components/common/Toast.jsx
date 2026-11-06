import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!duration || !onClose) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!message) return null

  const isError = type === 'error'

  return (
    <div
      className={`toast toast-floating ${isError ? 'toast--error' : 'toast--success'}`}
      role="status"
      aria-live="polite"
    >
      {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            marginLeft: '8px',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Close notification"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
