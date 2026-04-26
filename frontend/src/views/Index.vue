<template>
  <div class="page-index">
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-icon">📷</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.cameraCount }}</span>
          <span class="stat-label">摄像头</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🎬</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.videoCount }}</span>
          <span class="stat-label">已检测视频</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📦</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.resultCount }}</span>
          <span class="stat-label">检测物品</span>
        </div>
      </div>
    </div>

    <div class="content-row">
      <!-- Upload Card -->
      <div class="card upload-card">
        <div class="section-header">
          <h2>📤 上传监控视频</h2>
          <p>选择对应的摄像头，上传监控视频进行物品检测</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef">
          <el-form-item label="选择摄像头" prop="cameraId">
            <el-select v-model="form.cameraId" placeholder="请选择摄像头" style="width: 100%">
              <el-option
                v-for="camera in cameras"
                :key="camera.id"
                :label="`${camera.id} - ${camera.location}`"
                :value="camera.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="选择视频">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              drag
              action="#"
              accept="video/*"
            >
              <div class="upload-content">
                <span class="upload-icon">📤</span>
                <span class="upload-text">点击或拖拽视频文件到此处</span>
                <span class="upload-hint">支持 MP4, AVI, MOV, MKV 格式，最大 500MB</span>
              </div>
            </el-upload>
          </el-form-item>

          <el-form-item v-if="videoFile">
            <div class="video-info">
              <span>📹 {{ videoFile.name }}</span>
              <span>📦 {{ formatFileSize(videoFile.size) }}</span>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="uploading" @click="handleUpload" style="width: 100%">
              {{ uploading ? '上传中...' : '上传并开始检测' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- Progress -->
        <div v-if="uploading" class="upload-progress">
          <el-progress :percentage="progress" :status="progressStatus" />
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </div>

      <!-- Tips & Actions -->
      <div class="side-panel">
        <div class="card tips-card">
          <h3>💡 使用步骤</h3>
          <div class="tips-list">
            <div class="tip-item"><span class="tip-num">1</span> 选择摄像头</div>
            <div class="tip-item"><span class="tip-num">2</span> 上传视频文件</div>
            <div class="tip-item"><span class="tip-num">3</span> 系统自动检测</div>
            <div class="tip-item"><span class="tip-num">4</span> 查看检测结果</div>
          </div>
        </div>

        <div class="card actions-card">
          <h3>⚡ 快捷操作</h3>
          <div class="action-buttons">
            <router-link to="/history" class="action-btn">📋 查看历史</router-link>
            <router-link to="/search" class="action-btn">🔍 搜索物品</router-link>
            <router-link to="/camera" class="action-btn">📷 管理摄像头</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCameras, getStats, uploadVideo } from '../api'

const cameras = ref([])
const stats = reactive({ cameraCount: 0, videoCount: 0, resultCount: 0 })
const formRef = ref(null)
const uploadRef = ref(null)
const videoFile = ref(null)
const uploading = ref(false)
const progress = ref(0)
const progressText = ref('')
const progressStatus = ref('')

const form = reactive({
  cameraId: ''
})

const rules = {
  cameraId: [{ required: true, message: '请选择摄像头', trigger: 'change' }]
}

const loadData = async () => {
  try {
    cameras.value = await getCameras()
    const statsData = await getStats()
    Object.assign(stats, statsData)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const handleFileChange = (file) => {
  videoFile.value = file.raw
}

const handleFileRemove = () => {
  videoFile.value = null
}

const formatFileSize = (size) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB'
  return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const handleUpload = async () => {
  if (!form.cameraId) {
    ElMessage.warning('请选择摄像头')
    return
  }
  if (!videoFile.value) {
    ElMessage.warning('请选择视频文件')
    return
  }

  uploading.value = true
  progress.value = 0
  progressText.value = '上传中...'
  progressStatus.value = ''

  const formData = new FormData()
  formData.append('file', videoFile.value)
  formData.append('camera_id', form.cameraId)

  try {
    const result = await uploadVideo(formData, (e) => {
      if (e.total) {
        progress.value = Math.round((e.loaded / e.total) * 50)
        progressText.value = `上传中... ${progress.value}%`
      }
    })

    progress.value = 50
    progressText.value = '上传成功，等待处理...'
    pollVideoStatus(result.id)
  } catch (error) {
    uploading.value = false
    progressStatus.value = 'exception'
    progressText.value = '上传失败'
    ElMessage.error(error.response?.data?.detail || '上传失败')
  }
}

const pollVideoStatus = async (videoId) => {
  const poll = async () => {
    try {
      const status = await fetch(`http://localhost:8000/api/video/${videoId}/status`).then(r => r.json())

      if (status.status === 'completed') {
        progress.value = 100
        progressStatus.value = 'success'
        progressText.value = '处理完成！'
        uploading.value = false
        ElMessage.success('检测完成')
        setTimeout(() => { window.location.href = '/history' }, 1500)
      } else if (status.status === 'failed') {
        progressStatus.value = 'exception'
        progressText.value = '处理失败'
        uploading.value = false
        ElMessage.error('视频处理失败')
      } else {
        const p = status.progress || 0
        progress.value = 50 + Math.round(p * 0.5)
        progressText.value = `处理中... ${p}%`
        setTimeout(poll, 2000)
      }
    } catch {
      setTimeout(poll, 5000)
    }
  }
  poll()
}

onMounted(() => { loadData() })
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon { font-size: 40px; }
.stat-value { font-size: 32px; font-weight: 700; color: #303133; }
.stat-label { font-size: 15px; color: #909399; }

.content-row {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header p {
  color: #909399;
  font-size: 14px;
  margin-top: 4px;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.upload-icon { font-size: 48px; opacity: 0.6; }
.upload-text { font-size: 15px; color: #606266; margin-top: 12px; }
.upload-hint { font-size: 13px; color: #c0c4cc; margin-top: 6px; }

.video-info {
  display: flex;
  gap: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
}

.upload-progress { margin-top: 16px; }
.progress-text { text-align: center; font-size: 14px; color: #909399; margin-top: 8px; }

.side-panel { display: flex; flex-direction: column; gap: 20px; }

.tips-card h3, .actions-card h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #303133;
}

.tips-list { display: flex; flex-direction: column; gap: 12px; }

.tip-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 15px;
  color: #606266;
}

.tip-num {
  width: 26px;
  height: 26px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: block;
  text-align: center;
  padding: 14px;
  background: #f5f7fa;
  border-radius: 8px;
  text-decoration: none;
  color: #606266;
  font-size: 15px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #409eff;
  color: #fff;
}

@media (max-width: 900px) {
  .content-row { grid-template-columns: 1fr; }
}
</style>
