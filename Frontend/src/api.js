export const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function readApiJson(response) {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (!text) {
    return {}
  }

  if (!contentType.includes('application/json')) {
    const isHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')
    throw new Error(
      isHtml
        ? `API request returned the website HTML instead of JSON. Check that ${response.url} is handled by the backend API.`
        : `API request returned ${contentType || 'an unknown content type'} instead of JSON.`
    )
  }

  return JSON.parse(text)
}
