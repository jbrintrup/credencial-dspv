'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const LOGO_COLEGIO = 'https://www.calhomes.cl/imagenes/LOGO_COLEGIO.png'
const LOGO_CPA = 'https://www.calhomes.cl/imagenes/LOGO_CPA.png'

export default function CredencialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const raw = sessionStorage.getItem('credencial_session')

    if (!raw) {
      router.replace('/')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      setData(parsed)
    } catch {
      sessionStorage.removeItem('credencial_session')
      router.replace('/')
      return
    }

    setLoading(false)

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [router])

  const cerrarSesion = () => {
    sessionStorage.removeItem('credencial_session')
    router.replace('/')
  }

  const cambiarCuenta = () => {
    sessionStorage.removeItem('credencial_session')
    window.open('https://accounts.google.com/AccountChooser', '_blank')
  }

  if (loading || !data) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.loading}>Cargando...</div>
        </div>
      </div>
    )
  }

  const profile = data.card || {}
  const user = data.user || {}

  const estado = profile?.status || 'CREDENCIAL'
  const esNoRegistrado = estado === 'NO REGISTRADO'
  const bloqueado = estado === 'INHABILITADO'

  const headerStyle = esNoRegistrado
    ? styles.gray
    : bloqueado
    ? styles.red
    : styles.green

  const nombre = profile?.full_name || user?.name || ''
  const email = user?.email || '-'
  const curso = profile?.course || ''
  const motivo = profile?.motivo_bloqueo || ''
  const fecha = now.toLocaleString('es-CL')

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={{ ...styles.header, ...headerStyle }}>
            {estado}
          </div>

          <div style={styles.brandRow}>
            <div style={styles.logoWrap}>
              <img src={LOGO_COLEGIO} style={styles.logo} alt="Logo Colegio" />
            </div>

            <div style={styles.brandTitle}>Credencial Convenios DSPV</div>

            <div style={styles.logoWrap}>
              <img src={LOGO_CPA} style={styles.logo} alt="Logo Centro de Padres" />
            </div>
          </div>

          <div style={styles.content}>
            <div style={styles.mainId}>
              {nombre ? <div style={styles.mainName}>{nombre}</div> : null}
              <div style={styles.mainEmail}>{email}</div>
            </div>

            {!esNoRegistrado && curso ? (
              <div style={styles.centerRow}>
                <div style={styles.coursePill}>{curso}</div>
              </div>
            ) : null}

            <div style={styles.timeBox}>
              <div style={styles.timeLabel}>Generada</div>
              <div style={styles.timeValue}>{fecha}</div>
            </div>

            {!esNoRegistrado && bloqueado && motivo ? (
              <div style={styles.motivoBox}>
                <div style={styles.motivoLabel}>Motivo</div>
                <div style={styles.motivoValue}>{motivo}</div>
              </div>
            ) : null}
          </div>

          <div style={styles.footer}>


            <button onClick={cerrarSesion} style={styles.button}>
              Cerrar sesión
            </button>
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
  },
  wrap: {
    width: '100%',
    maxWidth: '520px',
    margin: '0 auto',
  },
  card: {
    width: '100%',
    background: '#ffffff',
    borderRadius: '22px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
    overflow: 'hidden',
  },
  header: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 800,
    padding: '16px 12px',
    fontSize: 'clamp(24px, 7vw, 34px)',
    lineHeight: 1.05,
    letterSpacing: '0.3px',
  },
  green: {
    background: '#15803d',
  },
  red: {
    background: '#c81e1e',
  },
  gray: {
    background: '#6b7280',
  },
  brandRow: {
    display: 'grid',
    gridTemplateColumns: '72px 1fr 72px',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 10px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  },
  logoWrap: {
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    maxHeight: '58px',
    maxWidth: '100%',
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  brandTitle: {
    textAlign: 'center',
    fontWeight: 800,
    fontSize: 'clamp(13px, 4.8vw, 19px)',
    lineHeight: 1.1,
    letterSpacing: '0.2px',
    color: '#1f2937',
    textTransform: 'uppercase',
    padding: '0 4px',
    wordBreak: 'break-word',
  },
  content: {
    padding: '16px 14px 14px',
  },
  mainId: {
    textAlign: 'center',
    marginBottom: '14px',
  },
  mainName: {
    fontSize: 'clamp(22px, 8vw, 40px)',
    lineHeight: 1.05,
    fontWeight: 800,
    color: '#111827',
    wordBreak: 'break-word',
    marginBottom: '8px',
  },
  mainEmail: {
    fontSize: 'clamp(15px, 4.6vw, 20px)',
    lineHeight: 1.25,
    fontWeight: 700,
    color: '#4b5563',
    wordBreak: 'break-word',
  },
  centerRow: {
    textAlign: 'center',
  },
  coursePill: {
    margin: '0 auto 14px',
    display: 'inline-block',
    padding: '10px 18px',
    borderRadius: '999px',
    background: '#f3f4f6',
    color: '#111827',
    fontSize: 'clamp(16px, 4.8vw, 20px)',
    fontWeight: 700,
    textAlign: 'center',
  },
  timeBox: {
    marginTop: '4px',
    padding: '14px 12px',
    borderRadius: '16px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: '11px',
    color: '#1d4ed8',
    marginBottom: '6px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  timeValue: {
    fontSize: 'clamp(18px, 6vw, 28px)',
    lineHeight: 1.15,
    fontWeight: 800,
    color: '#1e3a8a',
    wordBreak: 'break-word',
  },
  motivoBox: {
    marginTop: '14px',
    padding: '12px 14px',
    borderRadius: '14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
  },
  motivoLabel: {
    fontSize: '11px',
    color: '#b91c1c',
    marginBottom: '6px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  motivoValue: {
    fontSize: 'clamp(16px, 4.8vw, 20px)',
    lineHeight: 1.2,
    fontWeight: 700,
    color: '#7f1d1d',
    wordBreak: 'break-word',
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
    padding: '10px 14px 16px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },
  accountLink: {
    display: 'inline-block',
    marginTop: '2px',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '12px',
    cursor: 'pointer',
  },
  hint: {
    marginTop: '4px',
    fontSize: '11px',
    color: '#9ca3af',
  },
  loading: {
    width: '100%',
    background: 'white',
    borderRadius: '22px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
    padding: '24px 18px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '18px',
  },
  button: {
    marginTop: '14px',
    padding: '11px 18px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    background: '#111827',
    color: '#ffffff',
    fontSize: '15px',
  },
}