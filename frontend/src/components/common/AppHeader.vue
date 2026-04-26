<template>
  <div class="header">
    <div class="header-container">
      <div class="app-name">
        <router-link to="/">
          <span class="logo-icon">📹</span>
          <span>校园失物寻找</span>
        </router-link>
      </div>
      <div class="nav">
        <router-link to="/" class="nav-item" active-class="active">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/history" class="nav-item" active-class="active">
          <span class="nav-icon">📋</span>
          <span>历史</span>
        </router-link>
        <router-link to="/search" class="nav-item" active-class="active">
          <span class="nav-icon">🔍</span>
          <span>搜索</span>
        </router-link>
        <router-link to="/camera" class="nav-item" active-class="active">
          <span class="nav-icon">📷</span>
          <span>摄像头</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  background: #ffffff;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-container {
  width: 1200px;
  max-width: 95%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-name a {
  color: #409eff;
  font-size: 20px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-name a:hover {
  color: #66b1ff;
}

.logo-icon {
  font-size: 24px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: #606266;
  text-decoration: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #409eff;
  color: #ffffff;
}

.nav-item.active:hover {
  background: #337ecc;
  color: #ffffff;
}

.nav-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    gap: 10px;
    padding: 10px 0;
    height: auto;
  }

  .nav-item {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
