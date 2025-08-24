import { useEffect, useState, useCallback } from 'react'

interface LightboxPayload {
  index?: number
  image?: string
  text?: string
  url?: string
}

export default function IframeLightbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [src, setSrc] = useState<string>('')
  const [title, setTitle] = useState<string>('')

  const isImage = (value: string) => /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(value) || /picsum\.photos/.test(value)

  const onClose = useCallback(() => {
    setIsOpen(false)
    setSrc('')
    setTitle('')
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<LightboxPayload>
      const { url, image, text } = ce.detail || {}
      const chosen = url || image || ''
      if (!chosen) return
      setSrc(chosen)
      setTitle(text || '')
      setIsOpen(true)
    }
    window.addEventListener('open-lightbox', handler as EventListener)
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('open-lightbox', handler as EventListener)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          position: 'relative',
          width: 'min(90vw, 1100px)',
          height: 'min(80vh, 700px)',
          background: 'rgba(10,10,10,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(30,30,30,0.7)',
            color: 'white',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {title ? (
          <div style={{ position: 'absolute', left: 12, top: 12, color: 'white', opacity: 0.8, zIndex: 2 }}>{title}</div>
        ) : null}

        {isImage(src) ? (
          <img
            src={src}
            alt={title || 'Lightbox'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'black' }}
          />
        ) : (
          <iframe
            title={title || 'Lightbox'}
            src={src}
            style={{ width: '100%', height: '100%', border: 'none', background: 'black' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}


