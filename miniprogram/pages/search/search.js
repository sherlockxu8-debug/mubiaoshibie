const api = require('../../utils/api.js')

Page({
  data: {
    cameraList: [],
    results: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    keyword: '',
    selectedCameraIndex: -1,
    minConfidence: 0.5
  },

  onLoad(options) {
    if (options.video_id) {
      this.setData({ selectedVideoId: parseInt(options.video_id) })
    }
    this.fetchCameras()
    this.fetchResults()
  },

  async fetchCameras() {
    try {
      const cameras = await api.getCameras()
      this.setData({ cameraList: cameras })
    } catch (err) {
      console.error('Failed to fetch cameras', err)
    }
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail.value })
  },

  onCameraChange(e) {
    this.setData({ selectedCameraIndex: e.detail.value })
  },

  getSelectedCameraId() {
    const { cameraList, selectedCameraIndex } = this.data
    if (selectedCameraIndex >= 0 && cameraList.length > selectedCameraIndex) {
      return cameraList[selectedCameraIndex].id
    }
    return null
  },

  async doSearch() {
    this.setData({ page: 1, results: [], hasMore: true })
    await this.fetchResults()
  },

  async fetchResults() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const params = {
        page: this.data.page,
        page_size: this.data.pageSize
      }

      if (this.data.keyword) {
        params.class_name = this.data.keyword
      }
      const cameraId = this.getSelectedCameraId()
      if (cameraId) {
        params.camera_id = cameraId
      }
      if (this.data.selectedVideoId) {
        params.video_id = this.data.selectedVideoId
      }
      params.min_confidence = this.data.minConfidence

      const res = await api.getResults(params)

      const results = this.data.page === 1 ? res.items : [...this.data.results, ...res.items]

      this.setData({
        results,
        hasMore: res.items.length === res.page_size,
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: '搜索失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.fetchResults()
    }
  }
})
