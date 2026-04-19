const api = require('../../utils/api.js')

Page({
  data: {
    cameraList: [],
    selectedCameraIndex: 0,
    videoPath: '',
    videoInfo: null,
    uploading: false,
    processing: false,
    statusText: ''
  },

  onLoad() {
    this.fetchCameras()
  },

  async fetchCameras() {
    try {
      const cameras = await api.getCameras()
      this.setData({ cameraList: cameras })
      if (cameras.length > 0) {
        this.setData({ selectedCameraIndex: 0 })
      }
    } catch (err) {
      wx.showToast({ title: '获取摄像头列表失败', icon: 'none' })
    }
  },

  onCameraChange(e) {
    this.setData({ selectedCameraIndex: e.detail.value })
  },

  getSelectedCameraId() {
    const { cameraList, selectedCameraIndex } = this.data
    if (cameraList.length > selectedCameraIndex) {
      return cameraList[selectedCameraIndex].id
    }
    return ''
  },

  chooseVideo() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({
          videoPath: res.tempFilePath,
          videoInfo: {
            duration: res.duration,
            size: res.size,
            height: res.height,
            width: res.width
          }
        })
      }
    })
  },

  async uploadVideo() {
    if (!this.data.videoPath) {
      wx.showToast({ title: '请先选择视频', icon: 'none' })
      return
    }
    const cameraId = this.getSelectedCameraId()
    if (!cameraId) {
      wx.showToast({ title: '请选择摄像头', icon: 'none' })
      return
    }

    this.setData({ uploading: true, statusText: '上传中...' })

    try {
      const result = await api.uploadVideo(this.data.videoPath, cameraId)
      wx.showToast({ title: '上传成功', icon: 'success' })
      this.setData({ statusText: '上传成功，开始处理...' })

      this.startPolling(result.id)

    } catch (err) {
      wx.showToast({ title: err.detail || '上传失败', icon: 'none' })
      this.setData({ uploading: false, statusText: '' })
    }
  },

  startPolling(videoId) {
    this.setData({ processing: true })

    const poll = async () => {
      if (!this.data.processing) return

      try {
        const status = await api.getVideoStatus(videoId)
        if (status.status === 'completed') {
          this.setData({ processing: false, statusText: '处理完成' })
          wx.showToast({ title: '检测完成', icon: 'success' })
          wx.navigateTo({ url: `/pages/history/history` })
        } else if (status.status === 'failed') {
          this.setData({ processing: false, statusText: '处理失败' })
          wx.showToast({ title: '处理失败', icon: 'none' })
        } else {
          this.setData({
            statusText: `处理中... ${status.progress || 0}%`
          })
          setTimeout(poll, 2000)
        }
      } catch (err) {
        setTimeout(poll, 5000)
      }
    }

    poll()
  },

  onUnload() {
    this.setData({ processing: false })
  }
})
