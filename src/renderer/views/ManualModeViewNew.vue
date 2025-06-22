<template>
  <div class="manual-mode-view">
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

    <!-- 分类规则区域 -->
    <div class="rules-editor section-box">
      <h3>分类规则</h3>

      <!-- 现有规则列表 -->
      <div v-if="props.classificationRules.length > 0" class="existing-rules">
        <div
          v-for="(rule, index) in props.classificationRules"
          :key="index"
          class="rule-item"
        >
          <span class="rule-label">规则 {{ index + 1 }}:</span>
          <span class="rule-category">{{ rule.categoryName }}</span>
          <span class="rule-type">{{
            rule.matchType === "extension" ? "按扩展名" : "按关键词"
          }}</span>
          <span class="rule-value">{{ rule.matchValue }}</span>
          <button @click="$emit('remove-rule', index)" class="remove-btn">
            删除
          </button>
        </div>
      </div>

      <!-- 添加新规则 -->
      <div class="add-rule-form">
        <h4>添加新规则</h4>
        <div class="form-row">
          <input
            v-model="newRule.categoryName"
            type="text"
            placeholder="分类名称 (如: 图片)"
            class="form-input"
          />
          <select v-model="newRule.matchType" class="form-select">
            <option value="extension">按扩展名</option>
            <option value="keyword">按关键词</option>
          </select>
          <input
            v-model="newRule.matchValue"
            type="text"
            :placeholder="
              newRule.matchType === 'extension'
                ? '如: .jpg,.png,.gif'
                : '如: 报告,文档'
            "
            class="form-input"
          />
          <button @click="handleAddRule" class="add-btn">添加</button>
        </div>
      </div>
    </div>

    <!-- 生成预览按钮 -->
    <div class="actions section-box">
      <h3>生成分类预览</h3>
      <p v-if="!props.sourceDirectoryPath" class="info-text">
        请先选择源文件目录。
      </p>
      <p
        v-if="
          props.classificationRules.length === 0 && props.sourceDirectoryPath
        "
        class="info-text"
      >
        请至少添加一条分类规则。
      </p>
      <button
        @click="$emit('generate-preview')"
        class="preview-btn"
        :disabled="
          !props.sourceDirectoryPath || props.classificationRules.length === 0
        "
      >
        生成分类预览
      </button>
    </div>

    <!-- 分类预览组件 -->
    <ClassificationPreview
      v-if="showPreview"
      :preview-data="previewData"
      :is-loading="isLoadingPreview"
      @confirm-classification="$emit('confirm-classification')"
      @cancel-preview="$emit('cancel-preview')"
    />

    <!-- 整理进度 -->
    <div
      v-if="props.organizationProgress || props.organizationLog.length > 0"
      class="progress-log section-box"
    >
      <h3>整理进度与日志</h3>
      <div v-if="props.organizationProgress" class="progress-bar">
        {{ props.organizationProgress }}
      </div>
      <ul class="log-list">
        <li v-for="(log, index) in props.organizationLog" :key="index">
          {{ log }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, defineProps, defineEmits } from "vue";
import ClassificationPreview from "../components/ClassificationPreview.vue";

interface ClassificationRule {
  categoryName: string;
  matchType: "extension" | "keyword";
  matchValue: string;
}

interface CategoryPreview {
  name: string;
  fileCount: number;
  sampleFiles: string[];
}

interface PreviewData {
  targetDirectory: string;
  categories: CategoryPreview[];
  totalFiles: number;
}

const props = defineProps<{
  sourceDirectoryPath: string | null;
  classificationRules: ClassificationRule[];
  organizationProgress: string | null;
  organizationLog: string[];
  showPreview: boolean;
  previewData: PreviewData | null;
  isLoadingPreview: boolean;
}>();

const newRule = reactive<ClassificationRule>({
  categoryName: "",
  matchType: "extension",
  matchValue: "",
});

const emit = defineEmits<{
  (e: "select-source-directory"): void;
  (e: "add-rule", rule: ClassificationRule): void;
  (e: "remove-rule", index: number): void;
  (e: "generate-preview"): void;
  (e: "confirm-classification"): void;
  (e: "cancel-preview"): void;
}>();

const handleAddRule = () => {
  if (!newRule.categoryName.trim() || !newRule.matchValue.trim()) {
    alert("请填写完整的分类规则信息");
    return;
  }

  emit("add-rule", { ...newRule });

  // 清空表单
  newRule.categoryName = "";
  newRule.matchType = "extension";
  newRule.matchValue = "";
};
</script>

<style scoped>
.manual-mode-view {
  padding: 10px;
}

.section-box {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

h3,
h4 {
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

.rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
}

.rule-label {
  font-weight: 500;
  min-width: 60px;
}

.rule-category {
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 3px;
  font-weight: 500;
}

.rule-type {
  background: #f3e5f5;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
}

.rule-value {
  flex: 1;
  font-family: monospace;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 3px;
}

.remove-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background-color: #c82333;
}

.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input {
  flex: 1;
}

.add-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-btn:hover {
  background-color: #218838;
}

.preview-btn {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.preview-btn:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}

.preview-btn:hover:not(:disabled) {
  background-color: #138496;
}

.info-text {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.progress-bar {
  background-color: #d1ecf1;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  color: #0c5460;
  border: 1px solid #bee5eb;
  text-align: center;
  font-weight: bold;
}

.log-list {
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.log-list li {
  padding: 5px 0;
  border-bottom: 1px dotted #eee;
  font-size: 13px;
  color: #555;
}

.log-list li:last-child {
  border-bottom: none;
}
</style>
