<template>
  <div class="dashboard-view">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <h1 class="welcome-title">欢迎使用智能文件管理器</h1>
      <p class="welcome-subtitle">让AI帮助您高效整理文件，告别混乱的文件夹</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        v-for="(stat, index) in statsArray"
        :key="stat.key"
        class="stat-card hover-lift"
        :style="{ animationDelay: index * 0.1 + 's' }"
      >
        <div class="stat-icon" :class="stat.iconClass">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-trend">
          <span class="trend-icon">{{ stat.trend }}</span>
        </div>
      </div>
    </div>

    <!-- 快速操作区域 -->
    <div class="quick-actions">
      <h2 class="section-title">快速开始</h2>
      <div class="action-cards">
        <div class="action-card" @click="$emit('navigate', 'workflow')">
          <div class="action-icon">🚀</div>
          <div class="action-content">
            <h3 class="action-title">开始整理</h3>
            <p class="action-description">使用引导流程快速整理文件</p>
          </div>
          <div class="action-arrow">→</div>
        </div>

        <div class="action-card" @click="$emit('navigate', 'ai')">
          <div class="action-icon">🤖</div>
          <div class="action-content">
            <h3 class="action-title">AI智能分类</h3>
            <p class="action-description">让AI分析并建议文件分类</p>
          </div>
          <div class="action-arrow">→</div>
        </div>

        <div class="action-card" @click="$emit('navigate', 'manual')">
          <div class="action-icon">✋</div>
          <div class="action-content">
            <h3 class="action-title">手动分类</h3>
            <p class="action-description">自定义规则进行文件分类</p>
          </div>
          <div class="action-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity">
      <h2 class="section-title">最近活动</h2>
      <div class="activity-list">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
          <div class="activity-status" :class="activity.status">
            {{ activity.statusText }}
          </div>
        </div>
      </div>
    </div>

    <!-- 系统状态 -->
    <div class="system-status">
      <h2 class="section-title">系统状态</h2>
      <div class="status-grid">
        <div class="status-item">
          <div
            class="status-indicator"
            :class="{ active: systemStatus.apiConnected }"
          ></div>
          <span>API连接</span>
        </div>
        <div class="status-item">
          <div
            class="status-indicator"
            :class="{ active: systemStatus.configValid }"
          ></div>
          <span>配置有效</span>
        </div>
        <div class="status-item">
          <div
            class="status-indicator"
            :class="{ active: systemStatus.diskSpace }"
          ></div>
          <span>磁盘空间</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineEmits } from "vue";

const emit = defineEmits<{
  (e: "navigate", viewId: string): void;
}>();

// 统计数据
const stats = reactive({
  totalFiles: 1247,
  processedFiles: 856,
  categories: 12,
  efficiency: 89,
});

// 统计卡片数组
const statsArray = computed(() => [
  {
    key: "totalFiles",
    icon: "📁",
    iconClass: "total-files",
    value: stats.totalFiles,
    label: "总文件数",
    trend: "📈",
  },
  {
    key: "processedFiles",
    icon: "✅",
    iconClass: "processed-files",
    value: stats.processedFiles,
    label: "已处理文件",
    trend: "⬆️",
  },
  {
    key: "categories",
    icon: "📂",
    iconClass: "categories",
    value: stats.categories,
    label: "分类数量",
    trend: "📊",
  },
  {
    key: "efficiency",
    icon: "⚡",
    iconClass: "efficiency",
    value: stats.efficiency + "%",
    label: "整理效率",
    trend: "🚀",
  },
]);

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    icon: "🤖",
    title: "AI分类完成",
    time: "2分钟前",
    status: "success",
    statusText: "成功",
  },
  {
    id: 2,
    icon: "📁",
    title: "手动整理文档文件",
    time: "15分钟前",
    status: "success",
    statusText: "完成",
  },
  {
    id: 3,
    icon: "⚙️",
    title: "更新API配置",
    time: "1小时前",
    status: "info",
    statusText: "已保存",
  },
  {
    id: 4,
    icon: "📊",
    title: "生成整理报告",
    time: "2小时前",
    status: "success",
    statusText: "完成",
  },
]);

// 系统状态
const systemStatus = reactive({
  apiConnected: true,
  configValid: true,
  diskSpace: true,
});
</script>

<style scoped>
.dashboard-view {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.welcome-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.6s ease-out both;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.stat-trend {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.trend-icon {
  font-size: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-3px);
  }
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
}

.quick-actions {
  margin-bottom: 40px;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.action-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border-radius: 12px;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.action-description {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.action-arrow {
  font-size: 20px;
  color: #3498db;
  font-weight: bold;
}

.recent-activity {
  margin-bottom: 40px;
}

.activity-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #ecf0f1;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 12px;
  color: #7f8c8d;
}

.activity-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.activity-status.success {
  background: #d4edda;
  color: #155724;
}

.activity-status.info {
  background: #d1ecf1;
  color: #0c5460;
}

.system-status {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.status-grid {
  display: flex;
  gap: 30px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2c3e50;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e74c3c;
  transition: background 0.2s ease;
}

.status-indicator.active {
  background: #27ae60;
}
</style>
