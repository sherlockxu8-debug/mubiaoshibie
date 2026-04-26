<template>
  <div class="page-search">
    <div class="page-header">
      <div class="header-left">
        <h2>🔍 搜索结果</h2>
        <p>查找物品出现的位置和时间</p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="card search-form">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="物品">
          <el-input v-model="searchForm.className" placeholder="物品名称" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="摄像头">
          <el-select v-model="searchForm.cameraId" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in cameras" :key="c.id" :label="c.id" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="置信度">
          <el-select v-model="searchForm.minConfidence" placeholder="全部" clearable style="width: 100px">
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
      <el-table :data="results" v-loading="loading" stripe size="small">
        <el-table-column prop="class_name" label="物品" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.class_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="80">
          <template #default="{ row }">
            <span :class="getConfidenceClass(row.confidence)">{{ (row.confidence * 100).toFixed(0) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="camera_id" label="摄像头" width="140">
          <template #default="{ row }">
            {{ row.camera_id }}<span v-if="getCameraLocation(row.camera_id)"> - {{ getCameraLocation(row.camera_id) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="100">
          <template #default="{ row }">
            {{ formatTimestamp(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="video_id" label="视频ID" width="70" />
        <el-table-column prop="created_at" label="检测时间" min-width="150">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          small
          @current-change="handlePageChange"
          :current-page="page"
          :page-size="pageSize"
          layout="prev, pager, next, total"
          :total="total"
        />
      </div>
    </div>

    <div v-if="!loading && results.length === 0" class="empty-state">
      <span class="empty-icon">📦</span>
      <h3>暂无检测结果</h3>
      <p>请上传视频进行检测，或调整搜索条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCameras, getResults } from '../api'

const route = useRoute()
const cameras = ref([])
const results = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)

const searchForm = reactive({
  className: '',
  cameraId: '',
  minConfidence: null,
  videoId: null
})

const loadCameras = async () => { cameras.value = await getCameras().catch(() => []) }

const loadResults = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (searchForm.className) params.class_name = searchForm.className
    if (searchForm.cameraId) params.camera_id = searchForm.cameraId
    if (searchForm.minConfidence) params.min_confidence = searchForm.minConfidence
    if (searchForm.videoId) params.video_id = searchForm.videoId
    const data = await getResults(params)
    results.value = data.items || []
    total.value = data.total || 0
  } catch { ElMessage.error('加载检测结果失败') } finally { loading.value = false }
}

const getCameraLocation = (id) => cameras.value.find(c => c.id === id)?.location || ''
const getConfidenceClass = (c) => c >= 0.7 ? 'conf-high' : c >= 0.5 ? 'conf-mid' : 'conf-low'
const formatTimestamp = (t) => (t || t === 0) ? `${Math.floor(t/60)}分${Math.floor(t%60)}秒` : '-'
const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '-'

const handleSearch = () => { page.value = 1; loadResults() }
const resetSearch = () => { searchForm.className = ''; searchForm.cameraId = ''; searchForm.minConfidence = null; searchForm.videoId = null; page.value = 1; loadResults() }
const handlePageChange = (val) => { page.value = val; loadResults() }

onMounted(async () => {
  await loadCameras()
  if (route.query.video_id) searchForm.videoId = parseInt(route.query.video_id)
  loadResults()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left h2 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-left p { color: #909399; font-size: 12px; margin-top: 2px; }

.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
}

.search-form { padding: 14px; }

.pagination { display: flex; justify-content: center; margin-top: 12px; }

.conf-high { color: #67c23a; font-weight: 600; }
.conf-mid { color: #e6a23c; font-weight: 600; }
.conf-low { color: #909399; }

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.empty-state h3 { font-size: 14px; color: #606266; margin-bottom: 6px; }
.empty-state p { font-size: 12px; color: #c0c4cc; }
</style>
