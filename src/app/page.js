'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const LOGO_COLEGIO = 'https://www.calhomes.cl/imagenes/LOGO_COLEGIO.png'
const LOGO_CPA = 'https://www.calhomes.cl/imagenes/LOGO_CPA.png'

export default function HomePage() {
  const router = useRouter()
  const buttonRef = useRef(null)
  const buttonWrapRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [buttonWidth, setButtonWidth] = useState(320)

  useEffect(() => {
    const updateButtonWidth = () => {
      if (!buttonWrapRef.current) return
      const wrapWidth = buttonWrapRef.current.offsetWidth
      const newWidth = Math.max(220, Math.min(360, wrapWidth - 24))
      setButtonWidth(newWidth)
    }

    updateButtonWidth()
    window.addEventListener('resize', updateButtonWidth)

    return () => window.removeEventListener('resize', updateButtonWidth)
  }, [])

  useEffect(() => {
    const session = sessionStorage.getItem('credencial_session')
    if (session) {
      router.replace('/credencial')
      return
    }

    const handleCredentialResponse = async (response) => {
      try {
        setErrorMsg('')

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        })

        const text = await res.text()
        let data = {}

        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          data = {}
        }

        if (!res.ok) {
          setErrorMsg(data.error || `Error ${res.status} al iniciar sesión`)
          sessionStorage.removeItem('credencial_session')
          return
        }

        sessionStorage.setItem('credencial_session', JSON.stringify(data))
        router.push('/credencial')
      } catch (error) {
        console.error(error)
        setErrorMsg('Ocurrió un error al validar el acceso.')
      }
    }

    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 300)
        return
      }

      if (!buttonRef.current) {
        setTimeout(initGoogle, 300)
        return
      }

      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        buttonRef.current.innerHTML = ''

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: buttonWidth,
          locale: 'es',
          text: 'signin_with',
        })

        setLoading(false)
      } catch (error) {
        console.error('Error inicializando Google:', error)
        setErrorMsg('No se pudo inicializar Google Sign-In.')
        setLoading(false)
      }
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existing) {
      initGoogle()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    script.onerror = () => {
      setErrorMsg('No se pudo cargar el acceso de Google.')
      setLoading(false)
    }
    document.body.appendChild(script)
  }, [router, buttonWidth])

  const tryAnotherAccount = () => {
    setErrorMsg('')
    sessionStorage.removeItem('credencial_session')
    window.location.href = 'https://accounts.google.com/AccountChooser'
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.topBand}>CREDENCIAL CONVENIOS DSPV</div>

          <div style={styles.brandRow}>
            <div style={styles.logoWrap}>
              <img src={LOGO_COLEGIO} style={styles.logo} alt="Logo Colegio" />
            </div>

            <div style={styles.brandCenter}>
              <div style={styles.title}>Bienvenido</div>
              <div style={styles.subtitle}>
                Ingresa con tu cuenta Google autorizada para ver tu credencial.
              </div>
            </div>

            <div style={styles.logoWrap}>
              <img src={LOGO_CPA} style={styles.logo} alt="Logo Centro de Padres" />
            </div>
          </div>

          <div style={styles.content}>
            <div style={styles.infoBox}>
              Acceso permitido para cuentas de los dominios autorizados del colegio.
            </div>

            <div style={styles.googleArea} ref={buttonWrapRef}>
              <div
                ref={buttonRef}
                style={{
                  ...styles.googleButtonWrap,
                  display: errorMsg ? 'none' : 'flex',
                }}
              />

              {loading && !errorMsg ? (
                <div style={styles.loadingBox}>Cargando acceso Google...</div>
              ) : null}

              {errorMsg ? (
                <div style={styles.errorBox}>
                  <div>{errorMsg}</div>
                  <button onClick={tryAnotherAccount} style={styles.smallButton}>
                    Intentar con otra cuenta
                  </button>
                </div>
              ) : null}
            </div>

            <div style={styles.helpText}>
              En teléfono, si Google abrió otra cuenta o una sesión antigua, usa “Intentar con otra cuenta”.
            </div>
          </div>

          <div style={styles.footer}>
            Sistema de credencial digital para convenios DSPV
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    margin: 0,
    minHeight: '100vh',
    width: '100%',
    background: '#eef2f7',
    fontFamily: 'Arial, sans-serif',
    padding: '10px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  },
  wrap: {
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
  },
  card: {
    width: '100%',
    background: '#ffffff',
    borderRadius: '22px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
    overflow: 'hidden',
  },
  topBand: {
    background: '#1f2937',
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 800,
    padding: '16px 12px',
    fontSize: 'clamp(22px, 6vw, 30px)',
    lineHeight: 1.1,
    letterSpacing: '0.3px',
  },
  brandRow: {
    display: 'grid',
    gridTemplateColumns: '68px 1fr 68px',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 10px 12px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  },
  logoWrap: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    maxHeight: '54px',
    maxWidth: '100%',
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  brandCenter: {
    textAlign: 'center',
    padding: '0 4px',
  },
  title: {
    fontSize: 'clamp(22px, 7vw, 30px)',
    lineHeight: 1.05,
    fontWeight: 800,
    color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: 'clamp(14px, 4.3vw, 16px)',
    lineHeight: 1.3,
    color: '#4b5563',
  },
  content: {
    padding: '18px 14px 18px',
    textAlign: 'center',
  },
  infoBox: {
    padding: '13px 14px',
    borderRadius: '16px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e3a8a',
    fontSize: 'clamp(14px, 4vw, 15px)',
    lineHeight: 1.35,
    marginBottom: '18px',
  },
  googleArea: {
    width: '100%',
    minHeight: '72px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonWrap: {
    width: '100%',
    justifyContent: 'center',
    marginTop: '4px',
  },
  loadingBox: {
    color: '#6b7280',
    fontSize: '16px',
    padding: '14px 0',
  },
  errorBox: {
    color: '#991b1b',
    fontSize: '14px',
    padding: '14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    maxWidth: '520px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  smallButton: {
    marginTop: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    background: '#111827',
    color: '#ffffff',
    fontSize: '13px',
  },
  helpText: {
    marginTop: '14px',
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: 1.4,
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
    padding: '12px 14px 14px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },
}