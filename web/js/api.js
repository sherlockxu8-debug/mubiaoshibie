// API Configuration
const API_BASE = 'http://localhost:8000/api';

// API Helper
async function request(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  } else if (data && method === 'GET') {
    const params = new URLSearchParams(data);
    url = `${url}?${params.toString()}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Upload file with FormData
async function uploadFile(url, file, formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${url}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (typeof onProgress === 'function') {
          onProgress(percent);
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(JSON.parse(xhr.responseText));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    const fd = new FormData();
    fd.append('file', file);
    Object.keys(formData).forEach(key => {
      fd.append(key, formData[key]);
    });

    xhr.send(fd);
  });
}

// API Methods
const api = {
  // Camera APIs
  getCameras: () => request('/camera/'),

  getCamera: (id) => request(`/camera/${id}`),

  addCamera: (data) => request('/camera/', 'POST', data),

  updateCamera: (id, data) => request(`/camera/${id}`, 'PUT', data),

  deleteCamera: (id) => request(`/camera/${id}`, 'DELETE'),

  // Video APIs
  uploadVideo: (file, cameraId) => {
    return uploadFile('/video/upload', file, { camera_id: cameraId });
  },

  getVideoStatus: (id) => request(`/video/${id}/status`),

  getVideos: (params) => request('/video/', 'GET', params),

  processVideo: (id) => request(`/video/${id}/process`, 'POST'),

  // Result APIs
  getResults: (params) => request('/result/', 'GET', params),

  getResult: (id) => request(`/result/${id}`),
};
