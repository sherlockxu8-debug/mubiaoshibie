// Search Page
document.addEventListener('DOMContentLoaded', () => {
  const resultList = document.getElementById('result-list');
  const resultsHeader = document.getElementById('results-header');
  const resultsTotal = document.getElementById('results-total');
  const keywordInput = document.getElementById('keyword');
  const cameraFilter = document.getElementById('camera-filter');
  const confidenceFilter = document.getElementById('confidence-filter');
  const sortBy = document.getElementById('sort-by');
  const btnSearch = document.getElementById('btn-search');
  const btnClear = document.getElementById('btn-clear');

  let page = 1;
  const pageSize = 20;
  let loading = false;
  let hasMore = true;
  let currentResults = [];
  let totalResults = 0;

  // Get video_id from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const videoIdFromUrl = urlParams.get('video_id');

  // Load cameras and initial results
  loadCameras();

  if (videoIdFromUrl) {
    // If coming from history with video_id, load directly
    loadResults(true);
  }

  // Event listeners
  btnSearch.addEventListener('click', () => {
    doSearch();
  });

  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      doSearch();
    }
  });

  keywordInput.addEventListener('input', () => {
    btnClear.style.display = keywordInput.value ? 'block' : 'none';
  });

  btnClear.addEventListener('click', () => {
    keywordInput.value = '';
    btnClear.style.display = 'none';
    keywordInput.focus();
  });

  confidenceFilter.addEventListener('change', doSearch);
  sortBy.addEventListener('change', () => {
    sortResults();
  });

  // Infinite scroll
  window.addEventListener('scroll', debounce(handleScroll, 200));

  async function loadCameras() {
    try {
      const cameras = await api.getCameras();
      cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera.id;
        option.textContent = `${camera.id} - ${camera.location}`;
        cameraFilter.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load cameras:', error);
    }
  }

  async function loadResults(reset = false) {
    if (loading) return;

    if (reset) {
      page = 1;
      hasMore = true;
      currentResults = [];
    }

    loading = true;

    if (reset) {
      resultList.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <span>搜索中...</span>
        </div>
      `;
    }

    try {
      const params = {
        page,
        page_size: pageSize,
        min_confidence: parseFloat(confidenceFilter.value) || 0
      };

      const keyword = keywordInput.value.trim();
      if (keyword) {
        params.class_name = keyword;
      }

      const cameraId = cameraFilter.value;
      if (cameraId) {
        params.camera_id = cameraId;
      }

      if (videoIdFromUrl) {
        params.video_id = parseInt(videoIdFromUrl);
      }

      const response = await api.getResults(params);
      const results = response.items;
      totalResults = response.total;

      if (results.length === 0 && page === 1) {
        resultList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🔎</span>
            <span class="empty-text">暂无检测结果</span>
            <span class="empty-hint">尝试其他关键词或降低置信度筛选</span>
          </div>
        `;
        resultsHeader.style.display = 'none';
        hasMore = false;
      } else {
        resultsHeader.style.display = 'flex';
        resultsTotal.textContent = totalResults;

        currentResults = reset ? results : [...currentResults, ...results];
        sortResults();

        if (results.length < pageSize) {
          hasMore = false;
        }

        if (hasMore) {
          window.addEventListener('scroll', handleScroll);
        }
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      resultList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">😵</span>
          <span class="empty-text">搜索失败</span>
          <span class="empty-hint">${error.message || '请稍后重试'}</span>
        </div>
      `;
    } finally {
      loading = false;
    }
  }

  function sortResults() {
    const sortType = sortBy.value;
    const sorted = [...currentResults];

    if (sortType === 'confidence') {
      sorted.sort((a, b) => b.confidence - a.confidence);
    } else if (sortType === 'timestamp') {
      sorted.sort((a, b) => a.timestamp - b.timestamp);
    }

    renderResults(sorted);
  }

  function renderResults(results) {
    if (results.length === 0) {
      resultList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔎</span>
          <span class="empty-text">暂无检测结果</span>
        </div>
      `;
      return;
    }

    const html = results.map((result, index) => {
      const confidencePercent = (result.confidence * 100).toFixed(1);
      const confidenceClass = result.confidence >= 0.7 ? 'high' : result.confidence >= 0.5 ? 'medium' : 'low';

      return `
        <div class="result-card" data-index="${index}">
          <div class="result-icon-wrapper">
            <span class="result-icon">📦</span>
          </div>
          <div class="result-details">
            <div class="result-name">${result.class_name}</div>
            <div class="result-meta">
              <span class="meta-item">
                <span class="meta-icon">⏱️</span> ${result.timestamp.toFixed(2)}秒
              </span>
              <span class="meta-item">
                <span class="meta-icon">📷</span> 帧 #${result.frame_index}
              </span>
              ${result.video_id ? `
                <span class="meta-item">
                  <span class="meta-icon">🎬</span> 视频 #${result.video_id}
                </span>
              ` : ''}
            </div>
            ${result.bbox ? `
              <div class="bbox-info">
                检测框: [${Object.values(result.bbox).join(', ')}]
              </div>
            ` : ''}
          </div>
          <div class="result-confidence">
            <div class="confidence-display confidence-${confidenceClass}">
              <span class="confidence-value">${confidencePercent}%</span>
              <span class="confidence-label">置信度</span>
            </div>
            <div class="confidence-bar">
              <div class="confidence-fill confidence-fill-${confidenceClass}" style="width: ${confidencePercent}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    resultList.innerHTML = html;
  }

  function doSearch() {
    page = 1;
    hasMore = true;
    window.removeEventListener('scroll', handleScroll);
    loadResults(true);
  }

  function handleScroll() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !loading) {
      window.removeEventListener('scroll', handleScroll);
      page++;
      loadResults(false);
    }
  }
});

// Global function for clear button
function clearSearch() {
  document.getElementById('keyword').value = '';
  document.getElementById('btn-clear').style.display = 'none';
}
