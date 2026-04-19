// Camera Management Page
document.addEventListener('DOMContentLoaded', () => {
  const cameraList = document.getElementById('camera-list');
  const cameraCount = document.getElementById('camera-count');
  const addForm = document.getElementById('add-form');
  const btnToggleForm = document.getElementById('btn-toggle-form');
  const btnRefresh = document.getElementById('btn-refresh');
  const cameraForm = document.getElementById('camera-form');
  const btnSubmit = document.getElementById('btn-submit');

  // Toggle form visibility
  btnToggleForm.addEventListener('click', () => {
    if (addForm.style.display === 'none') {
      addForm.style.display = 'block';
      btnToggleForm.innerHTML = '<span>×</span> 取消';
      btnToggleForm.classList.add('btn-cancel');
      cameraForm.reset();
    } else {
      hideForm();
    }
  });

  // Refresh button
  btnRefresh.addEventListener('click', () => {
    loadCameras();
  });

  // Form submit
  cameraForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('camera-id').value.trim();
    const location = document.getElementById('camera-location').value.trim();
    const building = document.getElementById('camera-building').value.trim();
    const floor = document.getElementById('camera-floor').value;
    const description = document.getElementById('camera-desc').value.trim();

    if (!id || !location) {
      showToast('请填写必填项', 'error');
      return;
    }

    // Check ID format
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      showToast('编号只能包含字母、数字、下划线和连字符', 'error');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner" style="width: 24rpx; height: 24rpx; border-width: 3rpx;"></span> 添加中...';

    try {
      await api.addCamera({
        id,
        location,
        building: building || null,
        floor: floor ? parseInt(floor) : null,
        description: description || null
      });

      showToast('添加成功', 'success');
      hideForm();
      loadCameras();

    } catch (error) {
      showToast(error.message || '添加失败', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>✓</span> 确认添加';
    }
  });

  // Load cameras on page load
  loadCameras();
});

async function loadCameras() {
  const cameraList = document.getElementById('camera-list');
  const cameraCount = document.getElementById('camera-count');

  cameraList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>
  `;

  try {
    const cameras = await api.getCameras();
    cameraCount.textContent = cameras.length;

    if (cameras.length === 0) {
      cameraList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📷</span>
          <span class="empty-text">暂无摄像头</span>
          <span class="empty-hint">点击上方添加按钮添加摄像头</span>
        </div>
      `;
      return;
    }

    renderCameras(cameras);

  } catch (error) {
    console.error('Failed to load cameras:', error);
    cameraList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">😵</span>
        <span class="empty-text">加载失败</span>
        <span class="empty-hint">${error.message || '请稍后重试'}</span>
      </div>
    `;
  }
}

function renderCameras(cameras) {
  const cameraList = document.getElementById('camera-list');

  const html = cameras.map(camera => {
    const statusClass = camera.status === 'active' ? 'active' : 'inactive';
    const statusText = camera.status === 'active' ? '在线' : '离线';

    return `
      <div class="camera-item" data-id="${camera.id}">
        <div class="camera-main">
          <div class="camera-header">
            <span class="camera-id-badge">${camera.id}</span>
            <span class="status-dot status-${statusClass}"></span>
            <span class="status-text status-text-${statusClass}">${statusText}</span>
          </div>
          <div class="camera-location">${camera.location}</div>
          <div class="camera-tags">
            ${camera.building ? `<span class="camera-tag">🏢 ${camera.building}</span>` : ''}
            ${camera.floor ? `<span class="camera-tag">📍 ${camera.floor}层</span>` : ''}
          </div>
          ${camera.description ? `<div class="camera-desc">${camera.description}</div>` : ''}
          <div class="camera-time">
            添加时间: ${formatDate(camera.created_at)}
          </div>
        </div>
        <div class="camera-actions">
          <button class="btn-action" onclick="editCamera('${camera.id}')" title="编辑">
            ✏️
          </button>
          <button class="btn-action btn-action-danger" onclick="deleteCamera('${camera.id}')" title="删除">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  cameraList.innerHTML = html;
}

function hideForm() {
  const addForm = document.getElementById('add-form');
  const btnToggleForm = document.getElementById('btn-toggle-form');

  addForm.style.display = 'none';
  btnToggleForm.innerHTML = '<span>+</span> 添加摄像头';
  btnToggleForm.classList.remove('btn-cancel');
  document.getElementById('camera-form').reset();
}

async function deleteCamera(id) {
  showConfirm(
    '确认删除',
    `确定要删除摄像头 <strong>${id}</strong> 吗？<br><span style="color: #ff4d4f;">此操作不可恢复</span>`,
    async () => {
      try {
        await api.deleteCamera(id);
        showToast('删除成功', 'success');

        // Animate removal
        const item = document.querySelector(`.camera-item[data-id="${id}"]`);
        if (item) {
          item.style.animation = 'slideOut 0.3s ease forwards';
          setTimeout(() => loadCameras(), 300);
        } else {
          loadCameras();
        }
      } catch (error) {
        showToast(error.message || '删除失败', 'error');
      }
    }
  );
}

async function editCamera(id) {
  // Show loading
  showModal('加载中', `
    <div style="text-align: center; padding: 20rpx;">
      <div class="spinner" style="margin: 0 auto;"></div>
    </div>
  `, []);

  try {
    const cameras = await api.getCameras();
    const camera = cameras.find(c => c.id === id);

    if (!camera) {
      closeModal();
      showToast('摄像头不存在', 'error');
      return;
    }

    closeModal();

    // Populate edit form
    document.getElementById('edit-id').value = camera.id;
    document.getElementById('edit-id-display').value = camera.id;
    document.getElementById('edit-location').value = camera.location;
    document.getElementById('edit-building').value = camera.building || '';
    document.getElementById('edit-floor').value = camera.floor || '';
    document.getElementById('edit-desc').value = camera.description || '';

    // Show edit modal
    document.getElementById('edit-modal').style.display = 'flex';

  } catch (error) {
    closeModal();
    showToast('获取摄像头信息失败', 'error');
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

async function submitEdit() {
  const id = document.getElementById('edit-id').value;
  const location = document.getElementById('edit-location').value.trim();
  const building = document.getElementById('edit-building').value.trim();
  const floor = document.getElementById('edit-floor').value;
  const description = document.getElementById('edit-desc').value.trim();

  if (!location) {
    showToast('请填写安装地点', 'error');
    return;
  }

  try {
    await api.updateCamera(id, {
      location,
      building: building || null,
      floor: floor ? parseInt(floor) : null,
      description: description || null
    });

    showToast('更新成功', 'success');
    closeEditModal();
    loadCameras();

  } catch (error) {
    showToast(error.message || '更新失败', 'error');
  }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  .camera-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 25rpx;
    border-bottom: 1rpx solid var(--border);
    transition: background 0.2s;
  }

  .camera-item:last-child {
    border-bottom: none;
  }

  .camera-item:hover {
    background: #fafafa;
  }

  .camera-main {
    flex: 1;
  }

  .camera-header {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 10rpx;
  }

  .camera-id-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    font-weight: bold;
  }

  .status-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
  }

  .status-dot.status-active {
    background: #52c41a;
  }

  .status-dot.status-inactive {
    background: #ff4d4f;
  }

  .status-text {
    font-size: 22rpx;
  }

  .status-text-active {
    color: #52c41a;
  }

  .status-text-inactive {
    color: #ff4d4f;
  }

  .camera-location {
    font-size: 30rpx;
    font-weight: bold;
    margin-bottom: 10rpx;
  }

  .camera-tags {
    display: flex;
    gap: 10rpx;
    flex-wrap: wrap;
    margin-bottom: 10rpx;
  }

  .camera-tag {
    background: #f5f5f5;
    padding: 6rpx 16rpx;
    border-radius: 6rpx;
    font-size: 24rpx;
    color: var(--text-light);
  }

  .camera-desc {
    font-size: 24rpx;
    color: var(--text-muted);
    margin-bottom: 8rpx;
  }

  .camera-time {
    font-size: 22rpx;
    color: var(--text-muted);
  }

  .camera-actions {
    display: flex;
    gap: 10rpx;
  }

  .btn-action {
    width: 60rpx;
    height: 60rpx;
    border: none;
    background: #f5f5f5;
    border-radius: 8rpx;
    font-size: 28rpx;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-action:hover {
    background: #e8e8e8;
  }

  .btn-action-danger:hover {
    background: #fff1f0;
  }

  .list-header {
    padding: 0 0 20rpx 0;
    border-bottom: 1rpx solid var(--border);
    margin-bottom: 10rpx;
  }

  .list-count {
    font-size: 26rpx;
    color: var(--text-muted);
  }

  .list-count strong {
    color: var(--primary);
  }

  .form-title {
    font-size: 32rpx;
    margin-bottom: 25rpx;
  }

  .input-hint {
    font-size: 22rpx;
    color: var(--text-muted);
    margin-top: 8rpx;
    display: block;
  }

  .btn-cancel {
    background: #fff1f0 !important;
    color: #ff4d4f !important;
    border: 2rpx solid #ff4d4f !important;
  }

  .camera-list {
    margin-top: 10rpx;
  }

  /* Result card styles */
  .result-card {
    display: flex;
    align-items: flex-start;
    padding: 25rpx;
    border-bottom: 1rpx solid var(--border);
    transition: background 0.2s;
  }

  .result-card:last-child {
    border-bottom: none;
  }

  .result-card:hover {
    background: #fafafa;
  }

  .result-icon-wrapper {
    margin-right: 20rpx;
  }

  .result-icon {
    font-size: 48rpx;
  }

  .result-details {
    flex: 1;
  }

  .result-name {
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
  }

  .result-meta {
    display: flex;
    gap: 20rpx;
    flex-wrap: wrap;
    font-size: 24rpx;
    color: var(--text-muted);
    margin-bottom: 8rpx;
  }

  .meta-icon {
    margin-right: 4rpx;
  }

  .bbox-info {
    font-size: 22rpx;
    color: var(--text-muted);
    background: #f5f5f5;
    padding: 6rpx 12rpx;
    border-radius: 6rpx;
    display: inline-block;
  }

  .result-confidence {
    text-align: right;
    min-width: 120rpx;
  }

  .confidence-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-bottom: 8rpx;
  }

  .confidence-value {
    font-size: 28rpx;
    font-weight: bold;
  }

  .confidence-label {
    font-size: 20rpx;
    color: var(--text-muted);
  }

  .confidence-high .confidence-value {
    color: #52c41a;
  }

  .confidence-medium .confidence-value {
    color: #faad14;
  }

  .confidence-low .confidence-value {
    color: #ff4d4f;
  }

  .confidence-bar {
    width: 100rpx;
    height: 6rpx;
    background: #e8e8e8;
    border-radius: 3rpx;
    overflow: hidden;
  }

  .confidence-fill-high {
    background: linear-gradient(90deg, #52c41a, #7cde5a);
  }

  .confidence-fill-medium {
    background: linear-gradient(90deg, #faad14, #ffc53d);
  }

  .confidence-fill-low {
    background: linear-gradient(90deg, #ff4d4f, #ff7875);
  }

  /* Search card */
  .search-card {
    margin-bottom: 20rpx;
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 20rpx;
    font-size: 28rpx;
    pointer-events: none;
  }

  .search-input-wrapper input {
    padding-left: 60rpx;
    padding-right: 60rpx;
  }

  .btn-clear {
    position: absolute;
    right: 15rpx;
    width: 40rpx;
    height: 40rpx;
    border: none;
    background: #e8e8e8;
    border-radius: 50%;
    font-size: 28rpx;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-filters {
    display: flex;
    gap: 15rpx;
    flex-wrap: wrap;
  }

  .search-filters select {
    flex: 1;
    min-width: 150rpx;
  }

  .filter-select {
    padding: 12rpx 20rpx;
    border: 2rpx solid var(--border);
    border-radius: 8rpx;
    font-size: 26rpx;
    background: #fff;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid var(--border);
    margin-bottom: 10rpx;
  }

  .results-count {
    font-size: 26rpx;
    color: var(--text-muted);
  }

  .results-count strong {
    color: var(--primary);
  }

  .results-sort select {
    padding: 8rpx 16rpx;
    border: 1rpx solid var(--border);
    border-radius: 6rpx;
    font-size: 24rpx;
  }

  /* Video card styles */
  .video-card {
    display: flex;
    align-items: center;
    padding: 25rpx;
    border-bottom: 1rpx solid var(--border);
    cursor: pointer;
    transition: background 0.2s;
  }

  .video-card:last-child {
    border-bottom: none;
  }

  .video-card:hover {
    background: #fafafa;
  }

  .video-icon-wrapper {
    margin-right: 20rpx;
  }

  .video-icon {
    font-size: 48rpx;
  }

  .video-details {
    flex: 1;
  }

  .video-name {
    font-size: 30rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
    word-break: break-all;
  }

  .video-meta {
    display: flex;
    gap: 20rpx;
    flex-wrap: wrap;
    font-size: 24rpx;
    color: var(--text-muted);
  }

  .video-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8rpx;
    margin-left: 20rpx;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6rpx;
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
  }

  .status-pending {
    background: #f5f5f5;
    color: var(--text-muted);
  }

  .status-processing {
    background: #e6f7ff;
    color: var(--primary);
  }

  .status-completed {
    background: #f6ffed;
    color: var(--success);
  }

  .status-failed {
    background: #fff1f0;
    color: var(--danger);
  }

  .processing-progress {
    width: 80rpx;
  }

  .progress-bar-small {
    height: 4rpx;
    background: #e8e8e8;
    border-radius: 2rpx;
    overflow: hidden;
  }

  .progress-fill-small {
    height: 100%;
    background: var(--primary);
    border-radius: 2rpx;
    transition: width 0.3s;
  }

  .video-actions {
    display: flex;
    gap: 10rpx;
    margin-left: 15rpx;
  }

  .btn-icon-only {
    width: 50rpx;
    height: 50rpx;
    border: none;
    background: #f5f5f5;
    border-radius: 8rpx;
    font-size: 26rpx;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-icon-only:hover {
    background: #e8e8e8;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15rpx;
    padding: 60rpx;
    color: var(--text-muted);
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30rpx;
  }

  .header-actions {
    display: flex;
    gap: 15rpx;
  }
`;
document.head.appendChild(style);
