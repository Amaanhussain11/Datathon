export const api = {
  async get(path) {
    const res = await fetch(path, { credentials: 'include' })
    const contentType = res.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await res.json() : await res.text()
    return { status: res.status, data }
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    })
    const contentType = res.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await res.json() : await res.text()
    return { status: res.status, data }
  }
}
