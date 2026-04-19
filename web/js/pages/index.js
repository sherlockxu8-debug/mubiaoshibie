// Index Page (Upload Video)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('video-file');
  const uploadArea = document.getElementById('file-upload-area');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const uploadPreview = document.getElementById('upload-preview');
  const fileName = document.getElementById('file-name');
  const videoInfo = document.getElementById('video-info');
  const videoDuration = document.getElementById('video-duration');
  const videoSize = document.getElementById('video-size');
  const videoResolution = document.getElementById('video-resolution');
  const btnUpload = document.getElementById('btn-upload');
  const btnReselect = document.getElementById('btn-reselect');
  const uploadStatus = document.getElementById('upload-status');
  const statusText = document.getElementById('status-text');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const cameraSelect = document.getElementById('camera-select');
  const cameraPreview = document.getElementById('camera-preview');
  const cameraBadge = document.getElementById('camera-badge');
  const cameraLocation = document.getElementById('camera-location');

  let selectedFile = null;
  let uploadProgress = 0;

  // Load initial stats and cameras
  loadStats();
  loadCameras();

  async function loadStats() {
    try {
      const [cameras, videos, results] = await Promise.all([
        api.getCameras().catch(() => []),
        api.getVideos({ page: 1, page_size: 1 }).catch(() => ({ total: 0 })),
        api.getResults({ page: 1, page_size: 1 }).catch(() => ({ total: 0 }))
      ]);

      document.getElementById('camera-count').textContent = cameras.length || '-';
      document.getElementById('video-count').textContent = videos.total || 0;
      document.getElementById('result-count').textContent = results.total || 0;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function loadCameras() {
    try {
      const cameras = await api.getCameras();
      cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera.id;
        option.textContent = `${camera.id} - ${camera.location}`;
        option.dataset.location = camera.location;
        option.dataset.building = camera.building || '';
        option.dataset.floor = camera.floor || '';
        cameraSelect.appendChild(option);
      });

      if (cameras.length === 0) {
        showToast('暂无摄像头，请先添加摄像头', 'warning');
      }
    } catch (error) {
      console.error('Failed to load cameras:', error);
      showToast('获取摄像头列表失败', 'error');
    }
  }

  // Camera select change
  cameraSelect.addEventListener('change', (e) => {
    const selected = e.target.selectedOptions[0];
    if (selected && selected.value) {
      cameraBadge.textContent = selected.value;
      cameraLocation.textContent = selected.dataset.location;
      cameraPreview.style.display = 'flex';
    } else {
      cameraPreview.style.display = 'none';
    }
  });

  // File upload handlers
  uploadArea.addEventListener('click', () => {
    if (!uploadStatus.style.display || uploadStatus.style.display === 'none') {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  btnReselect.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileSelect();
    fileInput.click();
  });

  function resetFileSelect() {
    selectedFile = null;
    fileInput.value = '';
    uploadPlaceholder.style.display = 'flex';
    uploadPreview.style.display = 'none';
    videoInfo.style.display = 'none';
    btnUpload.disabled = true;
    uploadStatus.style.display = 'none';
  }

  function handleFileSelect(file) {
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!file.type.startsWith('video/')) {
      showToast('请选择视频文件', 'error');
      return;
    }

    if (file.size > maxSize) {
      showToast('视频文件过大，最大支持 500MB', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display = 'flex';

    // Get video info
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      videoDuration.textContent = video.duration.toFixed(0);
      videoResolution.textContent = `${video.videoWidth} × ${video.videoHeight}`;
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);

    videoSize.textContent = formatFileSize(file.size);
    videoInfo.style.display = 'flex';

    // Enable upload button if camera is selected
    updateUploadButton();
  }

  function updateUploadButton() {
    btnUpload.disabled = !(selectedFile && cameraSelect.value);
  }

  cameraSelect.addEventListener('change', updateUploadButton);

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('请选择视频', 'error');
      return;
    }

    if (!cameraSelect.value) {
      showToast('请选择摄像头', 'error');
      return;
    }

    // Show confirmation
    showConfirm(
      '确认上传',
      `确定要上传视频 "${selectedFile.name}" 到摄像头 ${cameraSelect.value} 吗？`,
      async () => {
        await performUpload();
      }
    );
  });

  async function performUpload() {
    btnUpload.disabled = true;
    uploadStatus.style.display = 'block';
    uploadProgress = 0;
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    statusText.textContent = '上传中...';

    try {
      const result = await uploadWithProgress(selectedFile, cameraSelect.value, (percent) => {
        uploadProgress = percent * 0.5; // Upload is 50% of total progress
        progressFill.style.width = uploadProgress + '%';
        progressPercent.textContent = Math.round(uploadProgress) + '%';
        statusText.textContent = `上传中... ${Math.round(uploadProgress)}%`;
      });

      statusText.textContent = '上传成功，开始处理...';

      // Poll for processing status
      pollVideoStatus(result.id);

    } catch (error) {
      showToast(error.message || '上传失败', 'error');
      btnUpload.disabled = false;
      uploadStatus.style.display = 'none';
    }
  }

  async function uploadWithProgress(file, cameraId, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('camera_id', cameraId);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.open('POST', `${API_BASE}/video/upload`);
      xhr.send(fd);
    });
  }

  async function pollVideoStatus(videoId) {
    const poll = async () => {
      try {
        const status = await api.getVideoStatus(videoId);

        if (status.status === 'completed') {
          uploadProgress = 100;
          progressFill.style.width = '100%';
          progressPercent.textContent = '100%';
          statusText.textContent = '处理完成！';
          showToast('检测完成', 'success');

          showModal('检测完成', `
            <div style="text-align: center; padding: 20rpx;">
              <div style="font-size: 80rpx; margin-bottom: 20rpx;">🎉</div>
              <p style="font-size: 30rpx; margin-bottom: 10rpx;">视频处理完成！</p>
              <p style="color: var(--text-muted);">已自动跳转到历史记录</p>
            </div>
          `, [
            {
              text: '查看详情',
              type: 'primary',
              onClick: () => {
                window.location.href = `search.html?video_id=${videoId}`;
              }
            },
            {
              text: '留在本页',
              type: 'secondary',
              onClick: () => {
                resetFileSelect();
                loadStats();
              }
            }
          ]);

          // Auto redirect after 3 seconds
          setTimeout(() => {
            closeModal();
            window.location.href = 'history.html';
          }, 3000);

        } else if (status.status === 'failed') {
          statusText.textContent = '处理失败';
          showToast('视频处理失败', 'error');
          btnUpload.disabled = false;
          uploadStatus.style.display = 'none';
        } else {
          const progress = status.progress || 0;
          uploadProgress = 50 + progress * 0.5; // Processing is the second 50%
          progressFill.style.width = uploadProgress + '%';
          progressPercent.textContent = Math.round(uploadProgress) + '%';
          statusText.textContent = `处理中... ${Math.round(progress)}%`;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        setTimeout(poll, 5000);
      }
    };

    poll();
  }
});
