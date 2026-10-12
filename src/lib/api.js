import axios from 'axios'

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Admin calls resolve with the response body even on 401/403/429
const adminRequest = (method, url, body) =>
  client.request({ method, url: '/admin' + url, data: body, validateStatus: (status) => status < 500 }).then((r) => r.data)

export const adminApi = {
  exportUrl: (format) => `${client.defaults.baseURL}/admin/export?format=${format}`,
  responseExportUrl: (id) => `${client.defaults.baseURL}/admin/submissions/${id}/export`,
  session: () => adminRequest('get', '/session'),
  login: (password) => adminRequest('post', '/login', { password }),
  logout: () => adminRequest('post', '/logout'),
  submissions: () => adminRequest('get', '/submissions'),
}

export async function submitReport({ form, captcha }) {
  const res = await client.post('/form/submit', { form, captcha })
  return res?.data || {}
}
