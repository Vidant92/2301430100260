// src/api/axiosClient.ts
import axios from 'axios'
import { logger } from '../utils/logger'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    logger.info('API Request', {
      method: config.method,
      url: config.url,
    })
    return config
  },
  (error) => {
    logger.error('Request Error', error)
    return Promise.reject(error)
  }
)

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    logger.info('API Response', {
      method: response.config.method,
      url: response.config.url,
      status: response.status,
    })
    return response
  },
  (error) => {
    if (error.response) {
      logger.error('Response Error', error, {
        status: error.response.status,
        url: error.config.url,
      })
    } else {
      logger.error('Network Error', error)
    }
    return Promise.reject(error)
  }
)

export default axiosClient
