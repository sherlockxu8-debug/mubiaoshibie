<template>
  <div class="page-history">
    <div class="page-header">
      <div class="header-left">
        <h2>📋 检测历史</h2>
        <p>查看所有已上传视频的检测结果</p>
      </div>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 150px" clearable>
          <el-option label="全部" value="" />
          <el-option label="等待中" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
      </div>
    </div>

    <div class="card">
      <el-table :data="videos" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="filename" label="文件名" min-width="200" />
        <el-table-column prop="camera_id" label="摄像头" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.camera_id }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewResults(row)">
              查看结果
            </el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getVideos } from '../api'

const router = useRouter()
const videos = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')

const loadVideos = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const data = await getVideos(params)
    videos.value = data.items || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const viewResults = (video) => {
  if (video.status !== 'completed') {
    ElMessage.warning('该视频尚未处理完成')
    return
  }
  router.push({ path: '/search', query: { video_id: video.id } })
}

const handlePageChange = (val) => {
  page.value = val
  loadVideos()
}

watch(filterStatus, () => {
  page.value = 1
  loadVideos()
})

onMounted(() => {
  loadVideos()
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
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
