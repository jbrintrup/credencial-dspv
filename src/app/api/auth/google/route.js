import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

function csvToObjects(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const parseLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase())

  return lines.slice(1).map((line) => {
    const values = parseLine(line)
    const obj = {}

    headers.forEach((header, index) => {
      obj[header] = values[index] ?? ''
    })

    return obj
  })
}

function findField(row, options) {
  for (const key of options) {
    if (row[key] !== undefined && row[key] !== '') return row[key]
  }
  return ''
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { credential } = body || {}

    if (!credential) {
      return Response.json({ error: 'Falta credential' }, { status: 400 })
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload?.email || !payload?.email_verified) {
      return Response.json({ error: 'Email no verificado por Google' }, { status: 401 })
    }

    const email = payload.email.toLowerCase()
    const domain = email.split('@')[1] || ''
    const allowedDomains = ['apoderadosdspv.cl', 'dspuertovaras.cl']

    if (!allowedDomains.includes(domain)) {
      return Response.json(
        {
          error: 'Tu cuenta no pertenece a un dominio autorizado para esta credencial.',
        },
        { status: 403 }
      )
    }

    const csvRes = await fetch(process.env.CSV_URL, { cache: 'no-store' })

    if (!csvRes.ok) {
      return Response.json({ error: 'No se pudo leer el CSV' }, { status: 500 })
    }

    const csvText = await csvRes.text()
    const rows = csvToObjects(csvText)

    const match = rows.find((row) => {
      const rowEmail = findField(row, ['email', 'correo', 'mail']).toLowerCase()
      return rowEmail === email
    })

    if (!match) {
      return Response.json({
        ok: true,
        user: {
          email,
          name: payload.name || '',
        },
        card: {
          status: 'NO REGISTRADO',
          full_name: payload.name || '',
          course: '',
          motivo_bloqueo: 'Usuario no registrado en el sistema',
        },
      })
    }

    const fullName =
      findField(match, ['full_name', 'nombre', 'name']) || payload.name || ''
    const course = findField(match, ['course', 'curso'])
    const duesStatus = findField(match, ['dues_status', 'estado', 'estado_cuota']).toLowerCase()
    const enabledRaw = findField(match, ['enabled', 'habilitado'])
    const blockedRaw = findField(match, ['blacklisted', 'bloqueado'])
    const reason = findField(match, ['motivo_bloqueo', 'motivo', 'notes', 'nota'])

    const enabled =
      ['true', '1', 'si', 'sí', 'yes', 'x'].includes(String(enabledRaw).toLowerCase()) ||
      enabledRaw === ''

    const blacklisted =
      ['true', '1', 'si', 'sí', 'yes', 'x'].includes(String(blockedRaw).toLowerCase())

    const blocked = blacklisted || enabled === false || duesStatus === 'bloqueado'

    return Response.json({
      ok: true,
      user: {
        email,
        name: payload.name || '',
      },
      card: {
        status: blocked ? 'INHABILITADO' : 'HABILITADO',
        full_name: fullName,
        course: course || '',
        motivo_bloqueo: blocked ? reason || 'Cuenta no habilitada' : '',
      },
    })
  } catch (error) {
    return Response.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}