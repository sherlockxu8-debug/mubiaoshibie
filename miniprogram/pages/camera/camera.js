const api = require('../../utils/api.js')

Page({
  data: {
    cameraList: [],
    loading: false,
    showAddForm: false,
    newCamera: {
      id: '',
      location: '',
      building: '',
      floor: '',
      description: ''
    }
  },

  onLoad() {
    this.fetchCameras()
  },

  async fetchCameras() {
    try {
      const cameras = await api.getCameras()
      this.setData({ cameraList: cameras })
    } catch (err) {
      wx.showToast({ title: '获取摄像头列表失败', icon: 'none' })
    }
  },

  toggleAddForm() {
    this.setData({ showAddForm: !this.data.showAddForm })
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`newCamera.${field}`]: e.detail.value
    })
  },

  async addCamera() {
    const { newCamera } = this.data
    if (!newCamera.id || !newCamera.location) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }

    try {
      await api.addCamera({
        id: newCamera.id,
        location: newCamera.location,
        building: newCamera.building || null,
        floor: newCamera.floor ? parseInt(newCamera.floor) : null,
        description: newCamera.description || null
      })
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.setData({
        showAddForm: false,
        newCamera: { id: '', location: '', building: '', floor: '', description: '' }
      })
      this.fetchCameras()
    } catch (err) {
      wx.showToast({ title: err.detail || '添加失败', icon: 'none' })
    }
  },

  async deleteCamera(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个摄像头吗？',
      success: async res => {
        if (res.confirm) {
          try {
            await api.deleteCamera(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.fetchCameras()
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
