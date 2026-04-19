// History Page
document.addEventListener('DOMContentLoaded', () => {
  const videoList = document.getElementById('video-list');
  const btnRefresh = document.getElementById('btn-refresh');
  const statusFilter = document.getElementById('status-filter');

  let page = 1;
  const pageSize = 20;
  let loading = false;
  let hasMore = true;
  let currentVideos = [];

  // Load videos
  loadVideos(true);

  // Refresh button
  btnRefresh.addEventListener('click', () => {
    loadVideos(true);
  });

  // Status filter
  statusFilter.addEventListener('change', () => {
    loadVideos(true);
  });

  // Infinite scroll
  window.addEventListener('scroll', debounce(handleScroll, 200));

  async function loadVideos(reset = false) {
    if (loading) return;

    if (reset) {
      page = 1;
      hasMore = true;
      currentVideos = [];
    }

    loading = true;
    videoList.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>
    `;

    try {
      const params = {
        page,
        page_size: pageSize
      };

      const status = statusFilter.value;
      if (status) {
        params.status = status;
      }

      const response = await api.getVideos(params);
      const videos = response.items;

      if (videos.length === 0 && page === 1) {
        videoList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <span class="empty-text">暂无检测记录</span>
            <span class="empty-hint">
              ${statusFilter.value ? '没有符合筛选条件的记录' : '上传视频开始检测'}
            </span>
          </div>
        `;
        hasMore = false;
      } else {
        currentVideos = reset ? videos : [...currentVideos, ...videos];
        renderVideos(currentVideos);

        if (videos.length < pageSize) {
          hasMore = false;
        }

        if (hasMore) {
          // Add scroll listener
          window.addEventListener('scroll', handleScroll);
        }
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
      videoList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">😵</span>
          <span class="empty-text">加载失败</span>
          <span class="empty-hint">${error.message || '请稍后重试'}</span>
        </div>
      `;
    } finally {
      loading = false;
    }
  }

  function renderVideos(videos) {
    const html = videos.map((video, index) => {
      const statusConfig = {
        pending: { icon: '⏳', text: '等待中', class: 'pending' },
        processing: { icon: '🔄', text: '处理中', class: 'processing' },
        completed: { icon: '✅', text: '已完成', class: 'completed' },
        failed: { icon: '❌', text: '失败', class: 'failed' }
      };
      const status = statusConfig[video.status] || statusConfig.pending;

      return `
        <div class="video-card" data-index="${index}" onclick="goToSearch(${video.id})">
          <div class="video-icon-wrapper">
            <span class="video-icon">🎬</span>
          </div>
          <div class="video-details">
            <div class="video-name">${video.filename}</div>
            <div class="video-meta">
              <span class="meta-item">
                <span class="meta-icon">📹</span> ${video.camera_id}
              </span>
              <span class="meta-item">
                <span class="meta-icon">📅</span> ${formatDate(video.created_at)}
              </span>
              ${video.duration ? `
                <span class="meta-item">
                  <span class="meta-icon">⏱️</span> ${video.duration.toFixed(0)}秒
                </span>
              ` : ''}
            </div>
          </div>
          <div class="video-status">
            <span class="status-badge status-${status.class}">
              <span class="status-icon">${status.icon}</span>
              <span class="status-text">${status.text}</span>
            </span>
            ${video.status === 'processing' && video.frame_count ? `
              <div class="processing-progress">
                <div class="progress-bar-small">
                  <div class="progress-fill-small" style="width: ${video.progress || 0}%"></div>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="video-actions">
            <button class="btn-icon-only" onclick="event.stopPropagation(); viewDetails(${video.id})" title="查看详情">
              🔍
            </button>
            ${video.status === 'completed' ? `
              <button class="btn-icon-only" onclick="event.stopPropagation(); viewResults(${video.id})" title="查看检测结果">
                📦
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    videoList.innerHTML = html;
  }

  function handleScroll() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !loading) {
      window.removeEventListener('scroll', handleScroll);
      page++;
      loadVideos(false);
    }
  }
});

function goToSearch(videoId) {
  window.location.href = `search.html?video_id=${videoId}`;
}

function viewDetails(videoId) {
  showModal('视频详情', `
    <div style="text-align: center;">
      <div class="spinner" style="margin: 0 auto 20rpx;"></div>
      <span>加载中...</span>
    </div>
  `, []);

  api.getVideoStatus(videoId).then(status => {
    api.getVideos({ page: 1, page_size: 1 }).then(() => {
      // Get full video info from the list
    }).catch(() => {});
  }).catch(err => {
    closeModal();
    showToast('获取详情失败', 'error');
  });

  // For now, just show basic info
  showModal('视频详情', `
    <div class="detail-list">
      <div class="detail-item">
        <span class="detail-label">视频ID</span>
        <span class="detail-value">${videoId}</span>
      </div>
    </div>
  `, [
    { text: '关闭', type: 'secondary' }
  ]);
}

function viewResults(videoId) {
  window.location.href = `search.html?video_id=${videoId}`;
}
