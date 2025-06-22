<template>
  <div class="logs-view">
    <div class="logs-header">
      <h1>系统日志</h1>
      <div class="logs-controls">
        <div class="filter-group">
          <label>日志级别:</label>
          <select v-model="selectedLevel">
            <option value="">全部</option>
            <option value="INFO">信息</option>
            <option value="WARN">警告</option>
            <option value="ERROR">错误</option>
            <option value="SUCCESS">成功</option>
          </select>
        </div>
        <button class="clear-btn" @click="clearLogs">清空日志</button>
      </div>
    </div>

    <!-- 当前进度 -->
    <div v-if="organizationProgress" class="progress-section">
      <h2>当前进度</h2>
      <div class="progress-card">
        <div class="progress-indicator">
          <div class="progress-spinner"></div>
          <span class="progress-text">{{ organizationProgress }}</span>
        </div>
      </div>
    </div>

    <!-- 日志统计 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon total">📊</div>
        <div class="stat-content">
          <span class="stat-value">{{ totalLogs }}</span>
          <span class="stat-label">总日志数</span>
        </div>
        <div class="stat-trend">
          <span class="trend-icon">📈</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon error">❌</div>
        <div class="stat-content">
          <span class="stat-value">{{ errorCount }}</span>
          <span class="stat-label">错误数</span>
        </div>
        <div class="stat-progress">
          <div
            class="progress-bar"
            :style="{ width: errorPercentage + '%' }"
          ></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">⚠️</div>
        <div class="stat-content">
          <span class="stat-value">{{ warningCount }}</span>
          <span class="stat-label">警告数</span>
        </div>
        <div class="stat-progress">
          <div
            class="progress-bar warning"
            :style="{ width: warningPercentage + '%' }"
          ></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">✅</div>
        <div class="stat-content">
          <span class="stat-value">{{ successCount }}</span>
          <span class="stat-label">成功数</span>
        </div>
        <div class="stat-progress">
          <div
            class="progress-bar success"
            :style="{ width: successPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 实时图表 -->
    <div class="chart-section">
      <div class="chart-card">
        <h3>日志趋势</h3>
        <div class="chart-container">
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div
                v-for="(bar, index) in chartData"
                :key="index"
                class="chart-bar"
                :style="{ height: bar.height + '%' }"
                :title="`${bar.time}: ${bar.count} 条日志`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日志列表 -->
    <div class="logs-container">
      <div class="logs-list" ref="logsContainer">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          class="log-item"
          :class="getLogClass(log)"
        >
          <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          <div class="log-level">{{ getLogLevel(log.message) }}</div>
          <div class="log-message">{{ getLogMessage(log.message) }}</div>
        </div>

        <div v-if="filteredLogs.length === 0" class="empty-logs">
          <div class="empty-icon">📝</div>
          <p>暂无日志信息</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, defineProps } from "vue";

const props = defineProps<{
  organizationProgress: string | null;
  organizationLog: string[];
}>();

const selectedLevel = ref("");
const logsContainer = ref<HTMLElement>();

// 处理日志数据，添加时间戳
const processedLogs = computed(() => {
  return props.organizationLog.map((log, index) => ({
    message: log,
    timestamp: new Date(
      Date.now() - (props.organizationLog.length - index) * 1000
    ),
    id: index,
  }));
});

// 过滤日志
const filteredLogs = computed(() => {
  if (!selectedLevel.value) {
    return processedLogs.value;
  }

  return processedLogs.value.filter((log) => {
    const level = getLogLevel(log.message);
    return level === selectedLevel.value;
  });
});

// 统计数据
const totalLogs = computed(() => processedLogs.value.length);
const errorCount = computed(
  () =>
    processedLogs.value.filter((log) => getLogLevel(log.message) === "ERROR")
      .length
);
const warningCount = computed(
  () =>
    processedLogs.value.filter((log) => getLogLevel(log.message) === "WARN")
      .length
);
const successCount = computed(
  () =>
    processedLogs.value.filter((log) => getLogLevel(log.message) === "SUCCESS")
      .length
);

// 百分比计算
const errorPercentage = computed(() =>
  totalLogs.value > 0 ? (errorCount.value / totalLogs.value) * 100 : 0
);
const warningPercentage = computed(() =>
  totalLogs.value > 0 ? (warningCount.value / totalLogs.value) * 100 : 0
);
const successPercentage = computed(() =>
  totalLogs.value > 0 ? (successCount.value / totalLogs.value) * 100 : 0
);

// 图表数据
const chartData = computed(() => {
  const data = [];
  const now = new Date();

  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000); // 每分钟一个数据点
    const timeStr = time.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 模拟数据，实际应用中应该根据真实的时间戳统计
    const count = Math.floor(Math.random() * 20) + 1;
    const height = Math.min((count / 20) * 100, 100);

    data.push({
      time: timeStr,
      count,
      height,
    });
  }

  return data;
});

// 获取日志级别
const getLogLevel = (message: string): string => {
  if (message.includes("[ERROR]")) return "ERROR";
  if (message.includes("[WARN]")) return "WARN";
  if (
    message.includes("[SUCCESS]") ||
    message.includes("成功") ||
    message.includes("完成")
  )
    return "SUCCESS";
  return "INFO";
};

// 获取日志消息（去除级别标识）
const getLogMessage = (message: string): string => {
  return message.replace(/^\[.*?\]\s*/, "");
};

// 获取日志样式类
const getLogClass = (log: any): string => {
  const level = getLogLevel(log.message);
  return `log-${level.toLowerCase()}`;
};

// 格式化时间
const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 清空日志
const clearLogs = () => {
  // 这里应该触发一个事件来清空父组件的日志
  // emit('clear-logs');
  console.log("清空日志功能需要在父组件中实现");
};

// 自动滚动到底部
watch(
  () => props.organizationLog.length,
  () => {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
      }
    });
  }
);
</script>

<style scoped>
.logs-view {
  padding: 30px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.logs-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.clear-btn {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
}

.clear-btn:hover {
  background: #c0392b;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ecf0f1;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.progress-text {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.error {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  display: block;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
}

.trend-icon {
  font-size: 20px;
  color: #27ae60;
}

.stat-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #f8f9fa;
}

.progress-bar {
  height: 100%;
  background: #e74c3c;
  transition: width 0.3s ease;
}

.progress-bar.warning {
  background: #f39c12;
}

.progress-bar.success {
  background: #27ae60;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
}

.chart-container {
  height: 200px;
  position: relative;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
  background: linear-gradient(to top, #f8f9fa 0%, transparent 100%);
  border-radius: 8px;
  padding: 20px;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 8px;
  height: 100%;
  width: 100%;
  justify-content: space-around;
}

.chart-bar {
  background: linear-gradient(to top, #3498db, #5dade2);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  width: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.chart-bar:hover {
  background: linear-gradient(to top, #2980b9, #3498db);
  transform: scaleY(1.1);
}

.logs-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.logs-list {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.log-item {
  display: grid;
  grid-template-columns: 80px 80px 1fr;
  gap: 15px;
  padding: 12px 0;
  border-bottom: 1px solid #f8f9fa;
  align-items: center;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  font-size: 12px;
  color: #7f8c8d;
  font-family: monospace;
}

.log-level {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  text-align: center;
  text-transform: uppercase;
}

.log-info .log-level {
  background: #d1ecf1;
  color: #0c5460;
}

.log-error .log-level {
  background: #f8d7da;
  color: #721c24;
}

.log-warn .log-level {
  background: #fff3cd;
  color: #856404;
}

.log-success .log-level {
  background: #d4edda;
  color: #155724;
}

.log-message {
  font-size: 14px;
  color: #2c3e50;
  word-break: break-word;
}

.empty-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-logs p {
  font-size: 16px;
  margin: 0;
}

/* 滚动条样式 */
.logs-list::-webkit-scrollbar {
  width: 6px;
}

.logs-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.logs-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.logs-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
