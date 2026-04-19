const API_BASE = require('./config').API_BASE

function request(url, method, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + url,
      method,
      data,
      success: res => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

function uploadFile(url, filePath, name, data) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: API_BASE + url,
      filePath,
      name,
      formData: data,
      success: res => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(res.data))
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  uploadVideo: (filePath, cameraId) => {
    return uploadFile('/video/upload', filePath, 'file', { camera_id: cameraId })
  },

  getVideoStatus: (id) => {
    return request(`/video/${id}/status`, 'GET')
  },

  getVideos: (params) => {
    return request('/video/', 'GET', params)
  },

  processVideo: (id) => {
    return request(`/video/${id}/process`, 'POST')
  },

  getResults: (params) => {
    return request('/result/', 'GET', params)
  },

  getResult: (id) => {
    return request(`/result/${id}`, 'GET')
  },

  getCameras: () => {
    return request('/camera/', 'GET')
  },

  addCamera: (data) => {
    return request('/camera/', 'POST', data)
  },

  updateCamera: (id, data) => {
    return request(`/camera/${id}`, 'PUT', data)
  },

  deleteCamera: (id) => {
    return request(`/camera/${id}`, 'DELETE')
  }
}
