<template>
  <div class="llm-mode-view">
    <!-- 目录选择区域 -->
    <div class="directory-selection section-box">
      <h3>选择目录</h3>
      <div class="directory-item">
        <div class="directory-display">
          <span v-if="props.sourceDirectoryPathLlm" class="directory-path">{{
            props.sourceDirectoryPathLlm
          }}</span>
          <span v-else class="no-directory">请选择要整理的文件目录</span>
          <button @click="$emit('select-source-directory')" class="select-btn">
            {{ props.sourceDirectoryPathLlm ? "更改目录" : "选择目录" }}
          </button>
        </div>
      </div>
    </div>

    <!-- LLM 参数配置区域 -->
    <div class="llm-params-config section-box">
      <h3>分类参数</h3>
      <div class="form-group">
        <label for="classificationFocus">分类焦点/说明 (可选):</label>
        <textarea
          id="classificationFocus"
          v-model="llmParams.classificationFocus"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="numberOfCategories">期望分类数量 (可选):</label>
        <input
          type="number"
          id="numberOfCategories"
          v-model.number="llmParams.numberOfCategories"
        />
      </div>
      <div class="form-group">
        <label for="maxSamples">最大文件名样本数量 (可选):</label>
        <input
          type="number"
          id="maxSamples"
          v-model.number="llmParams.maxSamples"
        />
      </div>
      <button
        @click="handleGetLLMSuggestions"
        :disabled="!props.sourceDirectoryPathLlm || !props.llmApiKeyProp"
      >
        获取分类建议
      </button>
      <p v-if="!props.llmApiKeyProp" class="info-text error-text">
        请先在“设置”页面配置 API Key。
      </p>
      <p v-if="!props.sourceDirectoryPathLlm" class="info-text error-text">
        请先选择源文件目录。
      </p>
    </div>

    <!-- LLM 建议显示与确认 -->
    <div
      class="llm-suggestions section-box"
      v-if="localLlmCategorySuggestions.length > 0 || isLoadingSuggestions"
    >
      <h3>智能分类建议</h3>
      <p v-if="isLoadingSuggestions">正在获取建议，请稍候...</p>
      <LLMSuggestionsDisplay
        :suggestions="localLlmCategorySuggestions"
        v-if="!isLoadingSuggestions && localLlmCategorySuggestions.length > 0"
      />
      <CategorySelection
        :llm-suggestions="localLlmCategorySuggestions"
        @categories-confirmed="handleLocalCategoriesConfirmed"
        v-if="!isLoadingSuggestions && localLlmCategorySuggestions.length > 0"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="actions section-box">
      <h3>开始整理</h3>
      <p v-if="!props.sourceDirectoryPathLlm" class="info-text error-text">
        请先选择源文件目录。
      </p>
      <p
        v-if="
          localConfirmedLLMCategories.length === 0 &&
          props.sourceDirectoryPathLlm
        "
        class="info-text"
      >
        请先获取并确认分类建议。
      </p>
      <button
        @click="handleStartLLMOrganization()"
        class="start-button"
        :disabled="
          !props.sourceDirectoryPathLlm ||
          localConfirmedLLMCategories.length === 0 ||
          !props.llmApiKeyProp
        "
      >
        开始整理
      </button>
    </div>

    <!-- 日志显示 (使用 App.vue 传入的全局日志) -->
    <div class="progress-log section-box">
      <h3>整理进度与日志</h3>
      <div v-if="props.organizationProgressLlm" class="progress-bar">
        {{ props.organizationProgressLlm }}
      </div>
      <ul class="log-list">
        <li v-for="(log, index) in props.organizationLogLlm" :key="index">
          {{ log }}
        </li>
      </ul>
      <p
        v-if="
          props.organizationLogLlm.length === 0 &&
          !props.organizationProgressLlm
        "
        class="info-text"
      >
        暂无日志信息。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits, watch } from "vue";
import LLMSuggestionsDisplay from "../LLMSuggestionsDisplay.vue";
import CategorySelection from "../CategorySelection.vue";

// 从 App.vue 接收的 LLM 配置参数类型
interface LLMConfigDataForEmit {
  apiKey: string; // API Key 将从 props.llmApiKeyProp 获取
  classificationFocus?: string;
  numberOfCategories?: number;
  maxSamples?: number;
  // sourceDirectoryPath 和 recursive 将从 props 获取，不在此接口中
}

// 定义 Props
const props = defineProps<{
  sourceDirectoryPathLlm: string | null;
  // outputDirectoryPathLlm: string | null; // App.vue 中已 provide，这里不再需要作为 prop
  // unclassifiedFolderNameLlm: string; // App.vue 中已 provide
  // recursiveLlm: boolean; // App.vue 中已 provide
  organizationProgressLlm: string | null;
  organizationLogLlm: string[];
  llmApiKeyProp: string; // 从 App.vue 传入的 API Key
  // 由 App.vue 获取并传入的建议，当 App.vue 的 handleGetLLMSuggestions 完成后更新此 prop
  llmCategorySuggestionsFromApp: string[];
}>();

// 定义 Emits
const emit = defineEmits<{
  (e: "select-source-directory"): void;
  (e: "get-llm-suggestions-app", config: LLMConfigDataForEmit): void;
  (e: "categories-confirmed-app", categories: string[]): void;
  (e: "start-llm-organization-app"): void;
}>();

// 本地状态
const llmParams = reactive({
  classificationFocus: "",
  numberOfCategories: 10,
  maxSamples: 100,
});
const localLlmCategorySuggestions = ref<string[]>([]);
const localConfirmedLLMCategories = ref<string[]>([]);
const isLoadingSuggestions = ref(false);

// 监听从 App.vue 传入的建议列表，并更新本地列表
watch(
  () => props.llmCategorySuggestionsFromApp,
  (newSuggestions) => {
    localLlmCategorySuggestions.value = newSuggestions || [];
    isLoadingSuggestions.value = false; // 收到新建议（即使是空数组），表示加载完成
  },
  { deep: true }
);

// 处理获取 LLM 分类建议
const handleGetLLMSuggestions = () => {
  if (!props.sourceDirectoryPathLlm) {
    // alert("请先选择源文件目录。"); // UI 中已有提示
    return;
  }
  if (!props.llmApiKeyProp) {
    // alert("请先在设置中配置 API Key。"); // UI 中已有提示
    return;
  }
  isLoadingSuggestions.value = true;
  localLlmCategorySuggestions.value = []; // 清空旧建议，准备接收新的
  localConfirmedLLMCategories.value = []; // 清空已确认的分类

  emit("get-llm-suggestions-app", {
    apiKey: props.llmApiKeyProp, // 使用从 prop 传入的 API Key
    classificationFocus: llmParams.classificationFocus || undefined,
    numberOfCategories: llmParams.numberOfCategories || undefined,
    maxSamples: llmParams.maxSamples || undefined,
  });
};

// 处理从 CategorySelection 组件确认的分类
const handleLocalCategoriesConfirmed = (categories: string[]) => {
  localConfirmedLLMCategories.value = categories;
  emit("categories-confirmed-app", categories); // 将确认的分类通知 App.vue
};

// 处理开始 LLM 整理
const handleStartLLMOrganization = () => {
  if (
    !props.sourceDirectoryPathLlm ||
    localConfirmedLLMCategories.value.length === 0 ||
    !props.llmApiKeyProp
  ) {
    // 按钮的 disabled 状态已经处理了这些情况
    return;
  }
  emit("start-llm-organization-app");
};

console.log("LLMModeView.vue setup");
</script>

<style scoped>
.llm-mode-view {
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

.llm-params-config .form-group {
  margin-bottom: 15px;
}
.llm-params-config label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  font-size: 14px;
}
.llm-params-config input[type="number"],
.llm-params-config textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 14px;
}
.llm-params-config textarea {
  min-height: 60px;
  resize: vertical;
}
.llm-params-config button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  font-size: 14px;
}
.llm-params-config button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}

.actions .start-button {
  background-color: #17a2b8; /* LLM 特有颜色 */
  color: white;
  padding: 10px 18px;
  font-size: 15px;
}
.actions .start-button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}
.actions .start-button:hover:not(:disabled) {
  background-color: #138496;
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
  margin-top: 10px;
  margin-bottom: 10px;
}
.error-text {
  color: #dc3545; /* 红色，表示错误或需要注意 */
}
</style>
