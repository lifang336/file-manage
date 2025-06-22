<template>
  <div class="category-selection section-box">
    <h2>LLM 建议分类选择与确认</h2>
    <p v-if="!localSuggestions || localSuggestions.length === 0">
      暂无分类建议可供选择。请先获取 LLM 分类建议。
    </p>
    <div v-else>
      <p>请检查并选择您希望用于自动整理的分类，您可以编辑分类名称：</p>
      <ul class="suggestions-list">
        <li
          v-for="(suggestion, index) in localSuggestions"
          :key="suggestion.id"
          class="suggestion-item"
        >
          <input
            type="checkbox"
            :id="'suggestion-' + suggestion.id"
            v-model="suggestion.selected"
            class="checkbox"
          />
          <input
            type="text"
            v-model="suggestion.name"
            class="category-name-input"
            placeholder="分类名称"
          />
          <button @click="removeSuggestion(index)" class="remove-btn">
            移除
          </button>
        </li>
      </ul>
      <div class="add-category-form">
        <input
          type="text"
          v-model="newCategoryName"
          placeholder="手动添加新分类"
          class="category-name-input"
        />
        <button @click="addManualCategory" class="add-btn">添加分类</button>
      </div>
      <button
        @click="confirmSelection"
        class="confirm-button"
        :disabled="selectedCategories.length === 0"
      >
        确认选定分类并准备整理 ({{ selectedCategories.length }} 个)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";

// 为每个建议项定义一个更丰富的类型，包含可选状态和唯一ID
interface SelectableSuggestion {
  id: string; // 唯一ID，用于key和DOM元素
  name: string;
  selected: boolean;
}

const props = defineProps<{
  llmSuggestions: string[]; // 从父组件接收原始的LLM分类建议列表
}>();

const emit = defineEmits<{
  (e: "categories-confirmed", confirmedCategories: string[]): void;
}>();

// 本地存储可选择的分类建议，每个建议都是一个 SelectableSuggestion 对象
const localSuggestions = ref<SelectableSuggestion[]>([]);
const newCategoryName = ref<string>(""); // 用于手动添加新分类

// 生成唯一ID的简单函数
const generateId = () =>
  `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// 监听 props.llmSuggestions 的变化，以便在父组件获取新建议时更新本地列表
watch(
  () => props.llmSuggestions,
  (newSuggestions) => {
    if (newSuggestions && newSuggestions.length > 0) {
      localSuggestions.value = newSuggestions.map((name) => ({
        id: generateId(),
        name,
        selected: true, // 默认选中所有LLM建议的分类
      }));
    } else {
      localSuggestions.value = []; // 如果没有建议，则清空
    }
  },
  { immediate: true, deep: true } // immediate确保初始加载时也执行, deep可能不需要，因为是字符串数组
);

// 计算属性，获取当前所有选中的分类名称
const selectedCategories = computed(() => {
  return localSuggestions.value
    .filter((s) => s.selected && s.name.trim() !== "")
    .map((s) => s.name.trim());
});

// 移除一个建议项
const removeSuggestion = (index: number) => {
  localSuggestions.value.splice(index, 1);
};

// 手动添加新分类
const addManualCategory = () => {
  if (newCategoryName.value.trim() !== "") {
    // 检查是否已存在同名分类 (不区分大小写)
    const existing = localSuggestions.value.find(
      (s) =>
        s.name.trim().toLowerCase() ===
        newCategoryName.value.trim().toLowerCase()
    );
    if (existing) {
      alert(`分类 "${newCategoryName.value.trim()}" 已存在。`);
      // 如果已存在但未选中，则选中它
      if (!existing.selected) {
        existing.selected = true;
      }
    } else {
      localSuggestions.value.push({
        id: generateId(),
        name: newCategoryName.value.trim(),
        selected: true, // 手动添加的默认选中
      });
    }
    newCategoryName.value = ""; // 清空输入框
  } else {
    alert("请输入有效的分类名称。");
  }
};

// 用户确认选择
const confirmSelection = () => {
  if (selectedCategories.value.length > 0) {
    emit("categories-confirmed", selectedCategories.value);
    // 可以在这里添加一些用户反馈，例如一个提示或日志
    console.log("用户确认的分类:", selectedCategories.value);
  } else {
    alert("请至少选择一个分类。");
  }
};

onMounted(() => {
  // 初始化时，如果 props.llmSuggestions 有值，则填充 localSuggestions
  if (props.llmSuggestions && props.llmSuggestions.length > 0) {
    localSuggestions.value = props.llmSuggestions.map((name) => ({
      id: generateId(),
      name,
      selected: true, // 默认选中
    }));
  }
});
</script>

<style scoped>
.category-selection {
  /* section-box 样式已在 App.vue 中定义，这里可以添加特定样式 */
  margin-top: 20px;
}

.suggestions-list {
  list-style-type: none;
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  background-color: #fff;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 5px;
  border-bottom: 1px dotted #f0f0f0;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.checkbox {
  margin-right: 10px;
  transform: scale(1.2); /* 放大复选框 */
}

.category-name-input {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.category-name-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.remove-btn,
.add-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
  transition: background-color 0.2s ease;
}
.add-btn {
  background-color: #28a745;
}

.remove-btn:hover {
  background-color: #c82333;
}
.add-btn:hover {
  background-color: #218838;
}

.add-category-form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  margin-bottom: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ccc;
}

.confirm-button {
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  width: 100%;
  transition: background-color 0.3s ease;
}

.confirm-button:hover {
  background-color: #0056b3;
}

.confirm-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

p {
  margin-bottom: 10px;
  color: #555;
}
</style>
