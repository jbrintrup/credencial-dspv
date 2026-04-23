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
    const value = row[key]
    if (value && value.toString().trim() !== '') {
      return value.toString().trim()
    }
  }
  return ''
}

function parseBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['true', '1', 'si', 'sí', 'yes', 'x'].includes(normalized)
}

// 🔥 NUEVO: LOG A SUPABASE
async function sendCredentialLog(payload) {
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/credential_logs`

    await fetch(url, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Error enviando log a Supabase:', error)
  }
}

function fireAndForgetLog(payload) {
  sendCredentialLog(payload).catch(() => {})
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
      return Response.json(
        { error: 'Email no verificado por Google' },
        { status: 401 }
      )
    }

    const email = payload.email.toLowerCase()
    const domain = email.split('@')[1] || ''
    const userAgent = request.headers.get('user-agent') || ''

    const allowedDomains = [
      'apoderadosdspv.cl',
      'dspuertovaras.cl',
      'aulasdspv.cl',
      'cpadspv.cl',
    ]

    if (!allowedDomains.includes(domain)) {
      fireAndForgetLog({
        email,
        name: payload.name || '',
        domain,
        status: 'DENEGADO',
        course: '',
        motivo: 'Dominio no autorizado',
        source: 'webapp',
        user_agent: userAgent,
      })

      return Response.json(
        {
          error: 'Tu cuenta no pertenece a un dominio autorizado.',
        },
        { status: 403 }
      )
    }

    const csvRes = await fetch(process.env.CSV_URL, { cache: 'no-store' })

    if (!csvRes.ok) {
      return Response.json(
        { error: 'No se pudo leer el CSV' },
        { status: 500 }
      )
    }

    const csvText = await csvRes.text()
    const rows = csvToObjects(csvText)

    const match = rows.find((row) => {
      const rowEmail = findField(row, ['email']).toLowerCase()
      return rowEmail === email
    })

    if (!match) {
      const responsePayload = {
        ok: true,
        user: {
          email,
          name: payload.name || '',
        },
        card: {
          status: 'HABILITADO',
          full_name: payload.name || '',
          course: '',
          hijos: '',
          cursos_hijos: '',
          motivo_bloqueo: '',
          is_default: true,
        },
      }

      fireAndForgetLog({
        email,
        name: payload.name || '',
        domain,
        status: 'HABILITADO',
        course: '',
        motivo: '',
        source: 'webapp',
        user_agent: userAgent,
      })

      return Response.json(responsePayload)
    }

    const fullName =
      findField(match, ['nombre']) || payload.name || ''

    const course = findField(match, ['curso'])
    const hijos = findField(match, ['hijos'])
    const cursosHijos = findField(match, ['cursos_hijos'])

    const blockedRaw = findField(match, ['bloqueado'])
    const reason =
      findField(match, ['motivo']) ||
      findField(match, ['observaciones']) ||
      ''

    const blocked = parseBoolean(blockedRaw)

    const responsePayload = {
      ok: true,
      user: {
        email,
        name: payload.name || '',
      },
      card: {
        status: blocked ? 'INHABILITADO' : 'HABILITADO',
        full_name: fullName,
        course: course || '',
        hijos: hijos || '',
        cursos_hijos: cursosHijos || '',
        motivo_bloqueo: blocked ? reason || 'Cuenta no habilitada' : '',
        grupo: findField(match, ['grupo']) || '',
      },
    }

    fireAndForgetLog({
      email,
      name: fullName || payload.name || '',
      domain,
      status: blocked ? 'INHABILITADO' : 'HABILITADO',
      course: course || '',
      motivo: blocked ? reason || '' : '',
      source: 'webapp',
      user_agent: userAgent,
    })

    return Response.json(responsePayload)
  } catch (error) {
    console.error('Error en /api/auth/google:', error)

    return Response.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}