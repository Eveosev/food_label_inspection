import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 180000, // 180秒超时
  headers: {
    'Content-Type': 'multipart/form-data',
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API函数
export const detectLabel = async (formData) => {
  try {
    const response = await api.post('/detect', formData)
    return response
  } catch (error) {
    throw error
  }
}

export const detectWithDify = async (formData) => {
  try {
    const response = await api.post('/detect', formData)
    return response
  } catch (error) {
    throw error
  }
}

export const uploadFile = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload', formData)
    return response
  } catch (error) {
    throw error
  }
}

export const getDetectionHistory = async (params = {}) => {
  try {
    const response = await api.get('/history', { params })
    return response
  } catch (error) {
    throw error
  }
}

export const getDetectionResult = async (id) => {
  try {
    const response = await api.get(`/results/${id}`)
    return response
  } catch (error) {
    throw error
  }
}

export const saveDetectionRecord = async (data) => {
  try {
    const response = await api.post('/save', data)
    return response
  } catch (error) {
    throw error
  }
}

export const exportReport = async (id, format = 'pdf') => {
  try {
    const response = await api.get(`/export/${id}`, {
      params: { format },
      responseType: 'blob'
    })
    return response
  } catch (error) {
    throw error
  }
}

export default api 