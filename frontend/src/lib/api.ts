import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.warn('资源未找到')
    } else if (error.response?.status === 500) {
      console.error('服务器错误')
    }
    return Promise.reject(error)
  }
)

// 文章 API
export const articleApi = {
  list: (params?: Record<string, unknown>) => api.get('/articles', { params }),
  get: (id: number) => api.get(`/articles/${id}`),
  stats: (days = 7) => api.get('/articles/recent/days', { params: { days } }),
}

// 搜索 API
export const searchApi = {
  search: (params: { q: string } & Record<string, unknown>) =>
    api.get('/search', { params }),
}

// 本体 API
export const ontologyApi = {
  objects: (params?: Record<string, unknown>) =>
    api.get('/ontology/objects', { params }),
  relations: (params?: Record<string, unknown>) =>
    api.get('/ontology/relations', { params }),
  graph: (name: string, depth = 1) =>
    api.get(`/ontology/graph/${encodeURIComponent(name)}`, { params: { depth } }),
}

// 信源 API
export const sourceApi = {
  list: () => api.get('/sources'),
  logs: (sourceId: number, limit = 10) =>
    api.get(`/sources/${sourceId}/logs`, { params: { limit } }),
  overview: () => api.get('/sources/stats/overview'),
}

// 评分 API
export const scoreApi = {
  countries: () => api.get('/score/countries'),
  calculate: (data: { country_code: string; industry?: string }) =>
    api.post('/score/country', data),
  history: (countryCode: string, industry = 'NEV') =>
    api.get(`/score/history/${countryCode}`, { params: { industry } }),
}

// 贸易壁垒 API
export const barrierApi = {
  list: (params?: Record<string, unknown>) => api.get('/barriers', { params }),
  stats: () => api.get('/barriers/stats'),
}

// 企业追踪 API
export const enterpriseApi = {
  list: (params?: Record<string, unknown>) => api.get('/enterprises', { params }),
  timeline: (enterpriseId: string) => api.get(`/enterprises/timeline/${enterpriseId}`),
  enterprises: () => api.get('/enterprises/list'),
}

// 指标/图表数据 API
export const indicatorApi = {
  listSeries: (params?: { category?: string; chart_id?: string }) =>
    api.get('/indicators/series', { params }),
  getPoints: (series_key: string, params?: Record<string, unknown>) =>
    api.get(`/indicators/series/${series_key}/points`, { params }),
  getChart: (chart_id: string, params?: Record<string, unknown>) =>
    api.get(`/indicators/chart/${chart_id}`, { params }),
  getLatest: (params?: { series_keys?: string; days?: number }) =>
    api.get('/indicators/latest', { params }),
}

export default api
