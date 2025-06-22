<template>
  <div class="manual-mode-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>快速分类</h2>
      <p class="page-description">
        预设分类名称，系统将根据文件扩展名自动整理文件到对应分类文件夹。
      </p>
    </div>

    <!-- 目录选择区域 -->
    <div class="directory-selection section-box">
      <h3>选择目录</h3>
      <div class="directory-item">
        <div class="directory-display">
          <span v-if="props.sourceDirectoryPath" class="directory-path">{{
            props.sourceDirectoryPath
          }}</span>
          <span v-else class="no-directory">请选择要整理的文件目录</span>
          <button @click="$emit('select-source-directory')" class="select-btn">
            {{ props.sourceDirectoryPath ? "更改目录" : "选择目录" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分类名称设置 -->
    <div class="categories-editor section-box">
      <h3>分类设置</h3>
      <p class="info-text">
        输入分类名称，系统将根据常见文件扩展名自动分类文件。
      </p>

      <!-- 分类名称列表 -->
      <div class="categories-list">
        <div
          v-for="(category, index) in categoryNames"
          :key="index"
          class="category-item"
        >
          <span class="category-name">{{ category }}</span>
          <button @click="removeCategory(index)" class="remove-btn">
            删除
          </button>
        </div>
      </div>

      <!-- 添加新分类 -->
      <div class="add-category-form">
        <input
          type="text"
          v-model="newCategoryName"
          placeholder="输入分类名称，如：图片、文档、视频等"
          @keyup.enter="addCategory"
        />
        <button @click="addCategory" :disabled="!newCategoryName.trim()">
          添加分类
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions section-box">
      <h3>开始整理</h3>
      <p v-if="!props.sourceDirectoryPath" class="info-text error-text">
        请先选择要整理的文件目录。
      </p>
      <p
        v-if="categoryNames.length === 0 && props.sourceDirectoryPath"
        class="info-text"
      >
        请先添加分类名称。
      </p>
      <button
        @click="handleStartManualOrganization()"
        class="start-button"
        :disabled="!props.sourceDirectoryPath || categoryNames.length === 0"
      >
        开始整理
      </button>
    </div>

    <!-- 日志显示 -->
    <div class="progress-log section-box">
      <h3>整理进度与日志</h3>
      <div v-if="props.organizationProgress" class="progress-bar">
        {{ props.organizationProgress }}
      </div>
      <ul class="log-list">
        <li v-for="(log, index) in props.organizationLog" :key="index">
          {{ log }}
        </li>
      </ul>
      <p
        v-if="props.organizationLog.length === 0 && !props.organizationProgress"
        class="info-text"
      >
        暂无日志信息。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";

// 定义 Props
const props = defineProps<{
  sourceDirectoryPath: string | null;
  organizationProgress: string | null;
  organizationLog: string[];
}>();

// 定义 Emits
const emit = defineEmits<{
  (e: "select-source-directory"): void;
  (e: "start-manual-organization", categories: string[]): void;
}>();

// 本地状态
const categoryNames = ref<string[]>(["图片", "文档", "视频", "音频"]);
const newCategoryName = ref<string>("");

// 添加分类
const addCategory = () => {
  const name = newCategoryName.value.trim();
  if (name && !categoryNames.value.includes(name)) {
    categoryNames.value.push(name);
    newCategoryName.value = "";
  }
};

// 删除分类
const removeCategory = (index: number) => {
  categoryNames.value.splice(index, 1);
};

// 开始整理
const handleStartManualOrganization = () => {
  if (!props.sourceDirectoryPath || categoryNames.value.length === 0) {
    return;
  }
  emit("start-manual-organization", categoryNames.value);
};
</script>

<style scoped>
.manual-mode-view {
  padding: 10px;
}

/* 页面标题样式 */
.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.page-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.page-description {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.5;
  max-width: 600px;
  margin: 0 auto;
}

.section-box {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  color: #333;
  font-weight: 600;
}

.directory-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.directory-path {
  flex: 1;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.no-directory {
  flex: 1;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #666;
  font-style: italic;
}

.select-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.select-btn:hover {
  background-color: #0056b3;
}

.categories-list {
  margin-bottom: 20px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.category-name {
  font-size: 14px;
  color: #495057;
}

.remove-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #c82333;
}

.add-category-form {
  display: flex;
  gap: 10px;
}

.add-category-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 14px;
}

.add-category-form button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 15px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
}

.add-category-form button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}

.add-category-form button:hover:not(:disabled) {
  background-color: #218838;
}

.start-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 18px;
  font-size: 15px;
  border-radius: 4px;
  cursor: pointer;
}

.start-button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
  color: #6c757d;
}

.start-button:hover:not(:disabled) {
  background-color: #218838;
}

.progress-log .progress-bar {
  background-color: #d1ecf1;
  border-radius: 0.25rem;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  color: #0c5460;
  border: 1px solid #bee5eb;
  text-align: center;
  font-weight: bold;
}

.progress-log .log-list {
  list-style-type: none;
  padding-left: 0;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.progress-log .log-list li {
  padding: 5px 2px;
  color: #495057;
  border-bottom: 1px dotted #f1f3f5;
  word-break: break-all;
}

.progress-log .log-list li:last-child {
  border-bottom: none;
}

.info-text {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 10px;
}

.error-text {
  color: #dc3545;
}
</style>
