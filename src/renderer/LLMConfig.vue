<template>
  <div class="llm-config">
    <h2>LLM 配置</h2>
    <div>
      <label for="apiKey">API 密钥:</label>
      <input type="password" id="apiKey" v-model="config.apiKey" />
    </div>
    <div>
      <label for="classificationFocus">分类焦点/说明 (可选):</label>
      <textarea
        id="classificationFocus"
        v-model="config.classificationFocus"
      ></textarea>
    </div>
    <div>
      <label for="numberOfCategories">期望分类数量 (可选):</label>
      <input
        type="number"
        id="numberOfCategories"
        v-model.number="config.numberOfCategories"
      />
    </div>
    <div>
      <label for="maxSamples">最大文件名样本数量 (可选):</label>
      <input type="number" id="maxSamples" v-model.number="config.maxSamples" />
    </div>
    <button @click="getSuggestions">获取 LLM 分类建议</button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

// 定义配置对象的类型
interface LLMConfigData {
  apiKey: string;
  classificationFocus?: string;
  numberOfCategories?: number;
  maxSamples?: number;
}

// 定义组件的 props 和 emits
// eslint-disable-next-line no-unused-vars
const props = defineProps<{
  // 如果需要从父组件接收初始配置，可以在这里定义 props
}>();

// eslint-disable-next-line no-unused-vars
const emit = defineEmits<{
  (e: "get-suggestions", config: LLMConfigData): void;
}>();

// LLM 配置数据
const config = reactive<LLMConfigData>({
  apiKey: "",
  classificationFocus: "",
  numberOfCategories: 10, // 默认期望分类数量
  maxSamples: 100, // 默认最大文件名样本数量
});

// 触发获取建议的事件
const getSuggestions = () => {
  // 校验 apiKey 是否填写
  if (!config.apiKey.trim()) {
    alert("请填写 API 密钥");
    return;
  }
  emit("get-suggestions", { ...config });
};
</script>

<style scoped>
.llm-config {
  border: 1px solid #ccc;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
}

.llm-config div {
  margin-bottom: 12px;
}

.llm-config label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
}

.llm-config input[type="password"],
.llm-config input[type="number"],
.llm-config textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.llm-config button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.llm-config button:hover {
  background-color: #0056b3;
}
</style>
