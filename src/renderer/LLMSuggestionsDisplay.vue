<template>
  <div class="llm-suggestions-display">
    <h2>LLM 分类建议</h2>
    <ul v-if="suggestions && suggestions.length > 0">
      <li v-for="(suggestion, index) in suggestions" :key="index">
        {{ suggestion }}
      </li>
    </ul>
    <p v-else>暂无分类建议。</p>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line no-unused-vars
const props = defineProps<{
  suggestions: string[]; // 从父组件接收分类建议列表
}>();
</script>

<style scoped>
.llm-suggestions-display {
  border: 1px solid #ccc;
  padding: 16px;
  margin-top: 16px;
  border-radius: 8px;
}

.llm-suggestions-display ul {
  list-style-type: none;
  padding: 0;
}

.llm-suggestions-display li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.llm-suggestions-display li:last-child {
  border-bottom: none;
}

.llm-suggestions-display p {
  color: #777;
}
</style>
