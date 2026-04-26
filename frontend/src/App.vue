<template>
  <div class="app">
    <app-header />
    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>
    <app-footer />
  </div>
</template>

<script setup>
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #303133;
  background: #f5f7fa;
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
  padding: 70px 0 24px;
}

.container {
  width: 1400px;
  max-width: 98%;
  margin: 0 auto;
  padding: 0 12px;
}
</style>
