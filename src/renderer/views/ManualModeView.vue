<template>
  <div class="manual-mode-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>规则分类</h2>
      <p class="page-description">
        定义自定义分类规则，系统将根据文件扩展名或文件名关键词自动整理文件到对应分类文件夹。
      </p>
    </div>

    <!-- 目录选择区域 -->
    <div class="directory-selection section-box">
      <h3>选择目录</h3>
      <div class="directory-item">
        <label>源文件目录：</label>
        <div class="directory-display">
          <span v-if="props.sourceDirectoryPath" class="directory-path">{{
            props.sourceDirectoryPath
          }}</span>
          <span v-else class="no-directory">未选择目录</span>
          <button @click="$emit('select-source-directory')" class="select-btn">
            {{ props.sourceDirectoryPath ? "更改目录" : "选择目录" }}
          </button>
        </div>
      </div>
      <div class="directory-item">
        <label>输出目录（可选）：</label>
        <div class="directory-display">
          <span v-if="props.outputDirectoryPath" class="directory-path">{{
            props.outputDirectoryPath
          }}</span>
          <span v-else class="no-directory">将在源目录内创建分类文件夹</span>
          <button @click="$emit('select-output-directory')" class="select-btn">
            {{ props.outputDirectoryPath ? "更改目录" : "选择目录" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 规则定义区域 -->
    <div class="rules-editor section-box">
      <h3>分类规则</h3>
      <!-- 规则列表显示 -->
      <div
        v-for="(rule, index) in props.classificationRules"
        :key="index"
        class="rule-item"
      >
        <span>规则 {{ index + 1 }}:</span>
        <input
          type="text"
          :value="rule.categoryName"
          placeholder="分类名称 (如: 图片)"
          disabled
        />
        <select :value="rule.matchType" disabled>
          <option value="extension">按扩展名</option>
          <option value="keyword">按文件名关键词</option>
        </select>
        <input
          type="text"
          :value="rule.matchValue"
          placeholder="扩展名 (如: .jpg,.png) 或关键词"
          disabled
        />
        <button @click="handleRemoveRule(index)" class="remove-rule-btn">
          删除
        </button>
      </div>
      <!-- 添加新规则的表单 -->
      <div class="add-rule-form">
        <input
          type="text"
          v-model="localNewRule.categoryName"
          placeholder="新分类名称"
        />
        <select v-model="localNewRule.matchType">
          <option value="extension">按扩展名</option>
          <option value="keyword">按文件名关键词</option>
        </select>
        <input
          type="text"
          v-model="localNewRule.matchValue"
          placeholder="匹配内容"
        />
        <button @click="handleAddRule">添加规则</button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions section-box">
      <h3>生成分类预览</h3>
      <p v-if="!props.sourceDirectoryPath" class="info-text">
        请先在“全局目录与通用配置”中选择源目录。
      </p>
      <button
        @click="handleStartManualOrganization()"
        class="start-button"
        :disabled="
          !props.sourceDirectoryPath || props.classificationRules.length === 0
        "
      >
        开始整理
      </button>
    </div>

    <!-- 日志显示 (使用 App.vue 传入的全局日志) -->
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
import { reactive, defineProps, defineEmits } from "vue";

// 定义分类规则的接口
interface ClassificationRule {
  categoryName: string;
  matchType: "extension" | "keyword";
  matchValue: string;
}

// 定义 Props
const props = defineProps<{
  sourceDirectoryPath: string | null;
  outputDirectoryPath: string | null; // 接收但不在此视图中直接修改，用于整理操作
  classificationRules: ClassificationRule[];
  unclassifiedFolderName: string; // 用于整理操作
  recursive: boolean; // 用于整理操作
  organizationProgress: string | null;
  organizationLog: string[];
}>();

// 定义 Emits
const emit = defineEmits<{
  (e: "add-rule", rule: ClassificationRule): void;
  (e: "remove-rule", index: number): void;
  (e: "select-source-directory"): void;
  (e: "select-output-directory"): void;
  (e: "start-manual-organization"): void;
}>();

// 用于添加新规则的本地表单数据
const localNewRule = reactive<ClassificationRule>({
  categoryName: "",
  matchType: "extension",
  matchValue: "",
});

// 处理添加规则
const handleAddRule = () => {
  if (!localNewRule.categoryName.trim() || !localNewRule.matchValue.trim()) {
    // 实际的警告和日志由 App.vue 在接收到事件后处理
    // alert("新规则的分类名称和匹配内容不能为空。");
  }
  emit("add-rule", { ...localNewRule }); // 发送新规则数据
  // 清空本地表单，以便用户添加下一条
  localNewRule.categoryName = "";
  localNewRule.matchType = "extension";
  localNewRule.matchValue = "";
};

// 处理删除规则
const handleRemoveRule = (index: number) => {
  emit("remove-rule", index);
};

// 处理开始手动整理
const handleStartManualOrganization = () => {
  if (!props.sourceDirectoryPath) {
    // alert("请先在全局设置中选择源文件目录！"); // 已在模板中提示
    return;
  }
  if (props.classificationRules.length === 0) {
    // alert("请至少定义一条手动分类规则！"); // 按钮已禁用
    return;
  }
  emit("start-manual-organization");
};

console.log("ManualModeView.vue setup");
</script>

<style scoped>
.manual-mode-view {
  padding: 10px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  border: none;
  padding: 0;
}

.page-description {
  color: #6c757d;
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}
.section-box {
  padding: 20px; /* 统一内边距 */
  border: 1px solid #e0e0e0;
  border-radius: 8px; /* 统一圆角 */
  background-color: #f9f9f9; /* 统一背景色 */
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* 添加轻微阴影 */
}
h2,
h3 {
  /* 统一 h2, h3 样式 */
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  color: #333;
  font-weight: 600; /* 字体加粗 */
}

.rules-editor .rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px; /* 增加间距 */
  padding: 12px; /* 增加内边距 */
  border: 1px solid #e9ecef; /* 调整边框颜色 */
  border-radius: 6px; /* 调整圆角 */
  background-color: #fff;
}

.rules-editor .rule-item span {
  min-width: 60px; /* 调整宽度 */
  font-size: 14px;
  color: #495057; /* 调整颜色 */
}

.rules-editor input[type="text"],
.rules-editor select {
  padding: 10px; /* 增加内边距 */
  border: 1px solid #ced4da; /* 调整边框颜色 */
  border-radius: 4px;
  font-size: 14px;
  flex-grow: 1;
  background-color: #fff; /* 确保背景色 */
}
.rules-editor select {
  flex-grow: 0.5;
}
.rules-editor input[disabled],
.rules-editor select[disabled] {
  background-color: #e9ecef; /* 禁用时的背景色 */
  color: #6c757d;
  cursor: not-allowed;
  border-color: #ced4da;
}

.rules-editor .add-rule-form {
  display: flex;
  gap: 10px;
  margin-top: 20px; /* 增加间距 */
  padding-top: 15px;
  border-top: 1px dashed #ced4da; /* 调整颜色 */
}

.remove-rule-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px; /* 调整内边距 */
  font-size: 13px; /* 调整字体 */
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.remove-rule-btn:hover {
  background-color: #c82333;
}

.add-rule-form button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 15px; /* 调整内边距 */
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.add-rule-form button:hover {
  background-color: #218838;
}

.actions .start-button {
  background-color: #007bff; /* 主操作按钮颜色 */
  color: white;
  border: none;
  padding: 10px 18px; /* 调整内边距 */
  font-size: 15px; /* 调整字体 */
  border-radius: 4px;
  cursor: pointer;
  width: auto;
  margin-right: 10px;
  margin-bottom: 10px; /* 确保按钮下方有间距 */
  transition: background-color 0.2s ease;
}
.actions .start-button:disabled {
  background-color: #ced4da; /* 禁用颜色 */
  cursor: not-allowed;
  color: #6c757d;
}
.actions .start-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.progress-log .progress-bar {
  background-color: #d1ecf1;
  border-radius: 0.25rem;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  color: #0c5460;
  border: 1px solid #bee5eb; /* 添加边框 */
  text-align: center;
  font-weight: bold;
}

.progress-log .log-list {
  list-style-type: none;
  padding-left: 0;
  max-height: 250px; /* 调整高度 */
  overflow-y: auto;
  border: 1px solid #e9ecef; /* 调整颜色 */
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.progress-log .log-list li {
  padding: 5px 2px; /* 调整内边距 */
  color: #495057; /* 调整颜色 */
  border-bottom: 1px dotted #f1f3f5; /* 调整颜色 */
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
</style>
