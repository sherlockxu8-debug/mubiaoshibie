<template>
  <div class="page-search">
    <div class="page-header">
      <div class="header-left">
        <h2>🔍 搜索结果</h2>
        <p>查找物品出现的所有位置和时间</p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="card search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="物品名称">
          <el-input v-model="searchForm.className" placeholder="输入物品名称" clearable />
        </el-form-item>
        <el-form-item label="摄像头">
          <el-select v-model="searchForm.cameraId" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="camera in cameras"
              :key="camera.id"
              :label="camera.id"
              :value="camera.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="置信度">
          <el-select v-model="searchForm.minConfidence" placeholder="全部" clearable style="width: 120px">
            <el-option label="30%+" :value="0.3" />
            <el-option label="50%+" :value="0.5" />
            <el-option label="70%+" :value="0.7" />
            <el-option label="90%+" :value="0.9" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Results -->
    <div class="card">
      <el-table :data="results" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="class_name" label="物品名称" width="150">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.class_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="100">
          <template #default="{ row }">
            <span :class="getConfidenceClass(row.confidence)">
              {{ (row.confidence * 100).toFixed(0) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="camera_id" label="摄像头" width="120">
          <template #default="{ row }">
            <span v-if="getCameraLocation(row.camera_id)">
              {{ row.camera_id }} - {{ getCameraLocation(row.camera_id) }}
            </span>
            <span v-else>{{ row.camera_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="出现时间" width="180">
          <template #default="{ row }">
            {{ formatTimestamp(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="video_id" label="视频ID" width="100" />
        <el-table-column prop="created_at" label="检测时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          @current-change="handlePageChange"
          :current-page="page"
          :page-size="pageSize"
          layout="prev, pager, next, total"
          :total="total"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && results.length === 0" class="empty-state">
      <span class="empty-icon">📦</span>
      <h3>暂无检测结果</h3>
      <p>请上传视频进行检测，或调整搜索条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCameras, getResults } from '../api'

const route = useRoute()
const cameras = ref([])
const results = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const searchForm = reactive({
  className: '',
  cameraId: '',
  minConfidence: null,
  videoId: null
})

const loadCameras = async () => {
  try {
    cameras.value = await getCameras()
  } catch {
    console.error('加载摄像头失败')
  }
}

const loadResults = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value
    }
    if (searchForm.className) {
      params.class_name = searchForm.className
    }
    if (searchForm.cameraId) {
      params.camera_id = searchForm.cameraId
    }
    if (searchForm.minConfidence) {
      params.min_confidence = searchForm.minConfidence
    }
    if (searchForm.videoId) {
      params.video_id = searchForm.videoId
    }

    const data = await getResults(params)
    results.value = data.items || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('加载检测结果失败')
  } finally {
    loading.value = false
  }
}

const getCameraLocation = (cameraId) => {
  const camera = cameras.value.find(c => c.id === cameraId)
  return camera?.location || ''
}

const getConfidenceClass = (confidence) => {
  if (confidence >= 0.7) return 'confidence-high'
  if (confidence >= 0.5) return 'confidence-medium'
  return 'confidence-low'
}

const formatTimestamp = (timestamp) => {
  if (!timestamp && timestamp !== 0) return '-'
  const minutes = Math.floor(timestamp / 60)
  const seconds = Math.floor(timestamp % 60)
  return `${minutes}分${seconds}秒`
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const handleSearch = () => {
  page.value = 1
  loadResults()
}

const resetSearch = () => {
  searchForm.className = ''
  searchForm.cameraId = ''
  searchForm.minConfidence = null
  searchForm.videoId = null
  page.value = 1
  loadResults()
}

const handlePageChange = (val) => {
  page.value = val
  loadResults()
}

onMounted(() => {
  loadCameras().then(() => {
    if (route.query.video_id) {
      searchForm.videoId = parseInt(route.query.video_id)
    }
    loadResults()
  })
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left p {
  color: #909399;
  font-size: 13px;
  margin-top: 2px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-form {
  padding: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.confidence-high {
  color: #67c23a;
  font-weight: 600;
}

.confidence-medium {
  color: #e6a23c;
  font-weight: 600;
}

.confidence-low {
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 13px;
  color: #c0c4cc;
}
</style>
