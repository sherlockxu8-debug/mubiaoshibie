import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000
})

// Camera APIs
export const getCameras = () => api.get('/camera/').then(res => res.data)
export const getCamera = (id) => api.get(`/camera/${id}`).then(res => res.data)
export const addCamera = (data) => api.post('/camera/', data).then(res => res.data)
export const updateCamera = (id, data) => api.put(`/camera/${id}`, data).then(res => res.data)
export const deleteCamera = (id) => api.delete(`/camera/${id}`).then(res => res.data)

// Video APIs
export const getVideos = (params) => api.get('/video/', { params }).then(res => res.data)
export const getVideoStatus = (id) => api.get(`/video/${id}/status`).then(res => res.data)
export const uploadVideo = (formData, onProgress) => {
  return axios.post(`${API_BASE}/video/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }).then(res => res.data)
}
export const processVideo = (id) => api.post(`/video/${id}/process`).then(res => res.data)

// Detection Result APIs
export const getResults = (params) => api.get('/result/', { params }).then(res => res.data)
export const getResult = (id) => api.get(`/result/${id}`).then(res => res.data)

// Stats
export const getStats = async () => {
  try {
    const [cameras, videos, results] = await Promise.all([
      getCameras().catch(() => []),
      getVideos({ page: 1, page_size: 1 }).catch(() => ({ total: 0 })),
      getResults({ page: 1, page_size: 1 }).catch(() => ({ total: 0 }))
    ])
    return {
      cameraCount: cameras.length || 0,
      videoCount: videos.total || 0,
      resultCount: results.total || 0
    }
  } catch {
    return { cameraCount: 0, videoCount: 0, resultCount: 0 }
  }
}

export default api
