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
        background: 'rgba(0,0,0,0.9)',
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
      {/* Container for title bar and modal */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'min(90vw, 1100px)',
          gap: '12px'
        }}
      >
        {/* Title bar - positioned above the modal within its width */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          {/* Title */}
          {title ? (
            <div 
              style={{ 
                color: 'white', 
                fontSize: '16px',
                fontWeight: '600',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flex: 1,
                marginRight: '16px'
              }}
            >
              {title}
            </div>
          ) : null}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              color: 'white',
              padding: '8px',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: '600',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              flexShrink: 0
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Main modal container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'min(80vh, 700px)',
            background: 'rgba(10,10,10,0.98)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {isImage(src) ? (
          <img
            src={src}
            alt={title || 'Lightbox'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'black', borderRadius: '14px' }}
          />
        ) : (
          <iframe
            title={title || 'Lightbox'}
            src={src}
            style={{ width: '100%', height: '100%', border: 'none', background: 'black', borderRadius: '14px' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        </div>
      </div>
    </div>
  )
}


