import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const include = searchParams.get('include')
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    let url = `${backendUrl}/reminders`
    
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (include) params.append('include', include)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      await response.text()
      return NextResponse.json({ error: 'Backend request failed' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Reminders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 