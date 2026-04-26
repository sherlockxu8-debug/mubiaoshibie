<template>
  <div class="page-camera">
    <div class="page-header">
      <div class="header-left">
        <h2>📷 摄像头管理</h2>
        <p>管理校园监控摄像头信息</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">添加摄像头</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="cameras" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="编号" width="120" />
        <el-table-column prop="location" label="安装地点" min-width="200" />
        <el-table-column prop="building" label="楼栋" width="120">
          <template #default="{ row }">
            {{ row.building || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="楼层" width="100">
          <template #default="{ row }">
            {{ row.floor || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="摄像头编号" prop="id">
          <el-input v-model="form.id" :disabled="isEdit" placeholder="如 C001" />
        </el-form-item>
        <el-form-item label="安装地点" prop="location">
          <el-input v-model="form.location" placeholder="如 图书馆门口" />
        </el-form-item>
        <el-form-item label="楼栋">
          <el-input v-model="form.building" placeholder="如 图书馆" />
        </el-form-item>
        <el-form-item label="楼层">
          <el-input-number v-model="form.floor" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="摄像头描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCameras, addCamera, updateCamera, deleteCamera } from '../api'

const cameras = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)

const form = reactive({
  id: '',
  location: '',
  building: '',
  floor: null,
  description: ''
})

const rules = {
  id: [{ required: true, message: '请输入摄像头编号', trigger: 'blur' }],
  location: [{ required: true, message: '请输入安装地点', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑摄像头' : '添加摄像头')

const loadCameras = async () => {
  loading.value = true
  try {
    cameras.value = await getCameras()
  } catch (error) {
    ElMessage.error('加载摄像头列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (camera) => {
  isEdit.value = true
  Object.assign(form, {
    id: camera.id,
    location: camera.location,
    building: camera.building || '',
    floor: camera.floor,
    description: camera.description || ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      await updateCamera(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await addCamera(form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadCameras()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

const handleDelete = async (camera) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除摄像头 ${camera.id} 吗？`,
      '删除确认',
      { type: 'warning' }
    )
    await deleteCamera(camera.id)
    ElMessage.success('删除成功')
    loadCameras()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    location: '',
    building: '',
    floor: null,
    description: ''
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  loadCameras()
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
</style>
