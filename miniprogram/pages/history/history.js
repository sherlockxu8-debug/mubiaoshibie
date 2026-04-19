const api = require('../../utils/api.js')

Page({
  data: {
    videoList: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.fetchVideos()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.fetchVideos()
    }
  },

  async fetchVideos() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await api.getVideos({
        page: this.data.page,
        page_size: this.data.pageSize
      })

      const list = this.data.page === 1 ? res.items : [...this.data.videoList, ...res.items]

      this.setData({
        videoList: list,
        hasMore: res.items.length === res.page_size,
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: '获取列表失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  goToDetail(e) {
    const videoId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/search/search?video_id=${videoId}`
    })
  },

  onShow() {
    if (this.data.videoList.length > 0) {
      this.setData({ page: 1 })
      this.fetchVideos()
    }
  }
})
