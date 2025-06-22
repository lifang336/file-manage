<template>
  <div class="modern-app">
    <!-- 侧边栏导航 -->
    <ModernSidebar :current-view="currentView" @navigate="handleNavigate" />

    <!-- 主内容区域 -->
    <div class="main-content">
      <Transition name="page-transition" mode="out-in">
        <!-- 规则分类 -->
        <ManualModeView
          v-if="currentView === 'manual'"
          key="manual"
          :source-directory-path="sourceDirectoryPath"
          :output-directory-path="outputDirectoryPath"
          :classification-rules="classificationRules"
          :new-rule="newRule"
          :unclassified-folder-name="unclassifiedFolderName"
          :recursive="recursive"
          :organization-progress="organizationProgress"
          :organization-log="organizationLog"
          @select-source-directory="handleSelectSourceDirectory"
          @select-output-directory="handleSelectOutputDirectory"
          @add-rule="addRule"
          @remove-rule="removeRule"
          @start-manual-organization="() => startManualOrganization(false)"
        />

        <!-- AI智能分类 -->
        <LLMModeView
          v-else-if="currentView === 'ai'"
          key="ai"
          :source-directory-path-llm="sourceDirectoryPath"
          :output-directory-path-llm="outputDirectoryPath"
          :unclassified-folder-name-llm="unclassifiedFolderName"
          :recursive-llm="recursive"
          :organization-progress-llm="organizationProgress"
          :organization-log-llm="organizationLog"
          :llm-api-key-prop="llmApiKey"
          :llm-category-suggestions-from-app="llmCategorySuggestions"
          @update:llm-api-key="llmApiKey = $event"
          @get-llm-suggestions-app="handleGetLLMSuggestions"
          @categories-confirmed-app="handleCategoriesConfirmed"
          @start-llm-organization-app="() => startLLMOrganization(false)"
        />

        <!-- 设置 -->
        <SettingsView
          v-else-if="currentView === 'settings'"
          key="settings"
          @api-key-updated-app="handleApiKeyUpdated"
        />
      </Transition>
    </div>

    <!-- 全局加载遮罩 -->
    <LoadingSpinner
      v-if="isLoading"
      type="file"
      :text="loadingText"
      :is-overlay="true"
      :show-progress="showProgress"
      :progress="loadingProgress"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, provide } from "vue";

// 导入组件
import ModernSidebar from "./components/ModernSidebar.vue";
import ManualModeView from "./views/ManualModeView.vue";
import LLMModeView from "./views/LLMModeView.vue";
import SettingsView from "./views/SettingsView.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";

// 当前活动的视图
const currentView = ref<string>("manual");

// 加载状态
const isLoading = ref<boolean>(false);
const loadingText = ref<string>("");
const showProgress = ref<boolean>(false);
const loadingProgress = ref<number | null>(null);

// 导航处理
const handleNavigate = (viewId: string) => {
  currentView.value = viewId;
};

// --- 状态定义 ---
// 这些状态将部分保留在 App.vue 作为全局状态，或通过 props/emits 与子组件交互
// 或者通过 provide/inject 共享

// 定义 LLM 配置数据的接口 (与 LLMConfig.vue 中 emit 的类型一致)
interface LLMConfigData {
  apiKey: string; // 这个 apiKey 是从 LLMConfig 组件内部发出的，现在需要从 SettingsView 获取
  classificationFocus?: string;
  numberOfCategories?: number;
  maxSamples?: number;
}

// 定义 LLM 单个文件整理的选项接口 (将传递给主进程)
interface LLMOrganizationOptions {
  sourceDirectoryPath: string;
  outputDirectoryPath: string | null;
  confirmedCategories: string[];
  apiKey: string; // LLM 调用需要
  unclassifiedFolderName: string;
  recursive: boolean;
  isDryRun: boolean;
}

// 定义分类规则的接口
interface ClassificationRule {
  categoryName: string;
  matchType: "extension" | "keyword";
  matchValue: string;
}

// 全局状态
const sourceDirectoryPath = ref<string | null>(null);
const outputDirectoryPath = ref<string | null>(null);
const unclassifiedFolderName = ref<string>("未分类文件");
const recursive = ref<boolean>(true);
const organizationProgress = ref<string | null>(null);
const organizationLog = ref<string[]>([]);
const llmApiKey = ref<string>(""); // API Key 现在由 App.vue 管理，并通过 SettingsView 设置

// 手动模式特定状态 (仍在此处定义，并通过 props 传递给 ManualModeView)
const classificationRules = ref<ClassificationRule[]>([
  {
    categoryName: "图片",
    matchType: "extension",
    matchValue: ".jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp",
  },
  {
    categoryName: "文档",
    matchType: "extension",
    matchValue: ".doc,.docx,.pdf,.txt,.md,.ppt,.pptx,.xls,.xlsx",
  },
]);
const newRule = reactive<ClassificationRule>({
  categoryName: "",
  matchType: "extension",
  matchValue: "",
});

// LLM 模式特定状态 (部分在此定义，通过 props/emits 与 LLMModeView 交互)
const llmCategorySuggestions = ref<string[]>([]); // 这个会由 LLMModeView 内部获取和管理，但 App.vue 可能需要知道结果
const confirmedLLMCategories = ref<string[]>([]); // 这个也主要由 LLMModeView 管理

// --- provide 全局状态给子组件 ---
provide("sourceDirectoryPath", sourceDirectoryPath);
provide("outputDirectoryPath", outputDirectoryPath);
provide("unclassifiedFolderName", unclassifiedFolderName);
provide("recursive", recursive);
provide("organizationLog", organizationLog);
provide("organizationProgress", organizationProgress);
provide("llmApiKey", llmApiKey); // 提供 API Key 给 LLMModeView

// --- 方法 ---

// 处理从 SettingsView 更新的 API Key
const handleApiKeyUpdated = (newApiKey: string) => {
  llmApiKey.value = newApiKey;
  organizationLog.value.unshift(`[INFO] App.vue: API Key 已更新。`);
};

// 监听 API Key 变化，尝试从主进程获取初始值
onMounted(async () => {
  try {
    // @ts-ignore
    const storedApiKey = await window.electronAPI.getApiKey();
    if (storedApiKey) {
      llmApiKey.value = storedApiKey;
      organizationLog.value.unshift(
        "[INFO] App.vue: 成功从主进程恢复 API Key。"
      );
    }
  } catch (error) {
    organizationLog.value.unshift(
      "[WARN] App.vue: 无法从主进程恢复 API Key (可能尚未设置)。"
    );
  }
});

// 目录选择 (全局)
const handleSelectSourceDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      sourceDirectoryPath.value = paths;
      organizationLog.value.unshift(
        `[INFO] 已选择源目录: ${sourceDirectoryPath.value}`
      );
    } else {
      organizationLog.value.unshift("[INFO] 用户取消选择源目录。");
    }
  } catch (error: any) {
    sourceDirectoryPath.value = "选择目录失败";
    organizationLog.value.unshift(
      `[ERROR] 选择源目录失败: ${error.message || error}`
    );
  }
};

const handleSelectOutputDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      outputDirectoryPath.value = paths;
      organizationLog.value.unshift(
        `[INFO] 已选择输出目录: ${outputDirectoryPath.value}`
      );
    } else {
      organizationLog.value.unshift(
        "[INFO] 用户取消选择输出目录，将使用源目录。"
      );
      outputDirectoryPath.value = null;
    }
  } catch (error: any) {
    outputDirectoryPath.value = "选择目录失败";
    organizationLog.value.unshift(
      `[ERROR] 选择输出目录失败: ${error.message || error}`
    );
  }
};

// 手动模式方法 (由 ManualModeView emit 调用)
const addRule = (rule: ClassificationRule) => {
  // newRule 现在由 ManualModeView 内部管理和 emit
  if (!rule.categoryName.trim() || !rule.matchValue.trim()) {
    organizationLog.value.unshift(
      "[WARN] 新规则的分类名称和匹配内容不能为空。"
    );
    alert("新规则的分类名称和匹配内容不能为空。");
    return;
  }
  classificationRules.value.push({ ...rule });
  organizationLog.value.unshift(
    `[INFO] 添加规则: ${rule.categoryName} (${rule.matchType}: ${rule.matchValue})`
  );
};

const removeRule = (index: number) => {
  const removedRule = classificationRules.value.splice(index, 1);
  organizationLog.value.unshift(
    `[INFO] 删除规则: ${removedRule[0]?.categoryName}`
  );
};

const startManualOrganization = async (isDryRun: boolean) => {
  if (!sourceDirectoryPath.value) {
    alert("请先选择源文件目录！");
    organizationLog.value.unshift(
      `[ERROR] 手动${isDryRun ? "模拟运行" : "整理"}失败：未选择源文件目录。`
    );
    return;
  }
  if (classificationRules.value.length === 0) {
    alert("请至少定义一条手动分类规则！");
    organizationLog.value.unshift(
      `[ERROR] 手动${isDryRun ? "模拟运行" : "整理"}失败：未定义手动分类规则。`
    );
    return;
  }

  // organizationLog.value = []; // 清空旧日志 - 日志现在是全局的，不清空
  organizationProgress.value = `手动${isDryRun ? "模拟运行" : "整理"}准备中...`;
  organizationLog.value.unshift(
    `[INFO] 开始手动${isDryRun ? "模拟运行" : "文件整理"}过程...`
  );
  logCommonOrganizationParams(isDryRun, "手动");
  organizationLog.value.unshift(
    `[INFO] 手动分类规则数量: ${classificationRules.value.length}`
  );
  classificationRules.value.forEach((r, i) => {
    organizationLog.value.unshift(
      `[INFO]   规则 ${i + 1}: "${r.categoryName}" (${r.matchType}: ${
        r.matchValue
      })`
    );
  });

  try {
    // @ts-ignore
    await window.electronAPI.startManualOrganization({
      sourceDirectoryPath: sourceDirectoryPath.value,
      outputDirectoryPath: outputDirectoryPath.value,
      classificationRules: JSON.parse(
        JSON.stringify(classificationRules.value)
      ),
      unclassifiedFolderName: unclassifiedFolderName.value,
      recursive: recursive.value,
      isDryRun: isDryRun,
    });
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] 手动${isDryRun ? "模拟运行" : "整理"}启动失败: ${
        error.message || error
      }`
    );
    organizationProgress.value = `手动${
      isDryRun ? "模拟运行" : "整理"
    }启动失败: ${error.message || error}`;
  }
};

// LLM 模式方法 (由 LLMModeView emit 调用)
// handleGetLLMSuggestions 现在由 LLMModeView 内部处理，因为它需要 API Key
// App.vue 只需要知道建议列表和确认的分类，以便启动整理
const handleGetLLMSuggestions = async (config: LLMConfigData) => {
  // 这个方法现在由 LLMModeView 触发，并传递参数
  // App.vue 仍然需要这个方法来调用主进程，或者 LLMModeView 直接调用
  // 为了简化，让 LLMModeView 直接调用，App.vue 只负责传递必要的全局状态
  // 此处保留，以防 LLMModeView emit 事件需要 App.vue 处理
  if (!sourceDirectoryPath.value) {
    alert("请先选择源文件目录，再获取 LLM 分类建议。");
    organizationLog.value.unshift(
      "[ERROR] 获取 LLM 分类建议失败：未选择源文件目录。"
    );
    return;
  }
  if (!llmApiKey.value && !config.apiKey) {
    // 检查 App.vue 中的 llmApiKey 或 config 中的 apiKey
    alert(
      "API Key 未配置。请在设置页面配置 API Key，或确保 LLM 配置中已输入。"
    );
    organizationLog.value.unshift(
      "[ERROR] 获取 LLM 分类建议失败：API Key 未配置。"
    );
    return;
  }

  organizationLog.value.unshift("[INFO] App.vue: 开始获取 LLM 分类建议...");
  // llmCategorySuggestions.value = []; // 由 LLMModeView 管理
  // confirmedLLMCategories.value = []; // 由 LLMModeView 管理
  // llmApiKey.value = config.apiKey; // API Key 由 App.vue 全局管理

  try {
    // @ts-ignore
    const suggestions = await window.electronAPI.getLLMCategorySuggestions({
      sourceDirectoryPath: sourceDirectoryPath.value,
      apiKey: llmApiKey.value || config.apiKey, // 优先使用 App.vue 的，其次是组件传入的
      classificationFocus: config.classificationFocus,
      numberOfCategories: config.numberOfCategories,
      maxSamples: config.maxSamples,
      recursive: recursive.value,
    });
    if (suggestions && suggestions.length > 0) {
      llmCategorySuggestions.value = suggestions; // 更新 App.vue 中的建议，传递给 LLMModeView
      organizationLog.value.unshift(
        `[INFO] App.vue: 成功获取 ${suggestions.length} 条 LLM 分类建议。`
      );
    } else {
      llmCategorySuggestions.value = [];
      organizationLog.value.unshift("[INFO] App.vue: LLM 未返回任何分类建议。");
    }
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] App.vue: 获取 LLM 分类建议失败: ${error.message || error}`
    );
    llmCategorySuggestions.value = ["获取建议失败，请检查控制台日志。"];
  }
};

const handleCategoriesConfirmed = (categories: string[]) => {
  confirmedLLMCategories.value = categories; // 更新 App.vue 中的确认分类
  organizationLog.value.unshift(
    `[INFO] App.vue: 用户已确认 ${categories.length} 个分类: ${categories.join(
      ", "
    )}`
  );
};

const startLLMOrganization = async (isDryRun: boolean) => {
  if (!sourceDirectoryPath.value) {
    alert("请先选择源文件目录！");
    organizationLog.value.unshift(
      `[ERROR] LLM ${isDryRun ? "模拟运行" : "整理"}失败：未选择源文件目录。`
    );
    return;
  }
  if (confirmedLLMCategories.value.length === 0) {
    // 检查 App.vue 中的 confirmedLLMCategories
    alert("请先获取并确认 LLM 分类建议！");
    organizationLog.value.unshift(
      `[ERROR] LLM ${isDryRun ? "模拟运行" : "整理"}失败：未确认 LLM 分类。`
    );
    return;
  }
  if (!llmApiKey.value) {
    // 检查 App.vue 中的 llmApiKey
    alert("API Key 未配置。请在设置页面配置 API Key。");
    organizationLog.value.unshift(
      `[ERROR] LLM ${isDryRun ? "模拟运行" : "整理"}失败：API Key 未配置。`
    );
    return;
  }

  // organizationLog.value = []; // 全局日志不清空
  organizationProgress.value = `LLM ${isDryRun ? "模拟运行" : "整理"}准备中...`;
  organizationLog.value.unshift(
    `[INFO] App.vue: 开始 LLM ${isDryRun ? "模拟运行" : "文件整理"}...`
  );
  logCommonOrganizationParams(isDryRun, "LLM");
  organizationLog.value.unshift(
    `[INFO] App.vue: 使用 LLM 确认分类: ${confirmedLLMCategories.value.join(
      ", "
    )}`
  );

  const options: LLMOrganizationOptions = {
    sourceDirectoryPath: sourceDirectoryPath.value,
    outputDirectoryPath: outputDirectoryPath.value,
    confirmedCategories: confirmedLLMCategories.value,
    apiKey: llmApiKey.value,
    unclassifiedFolderName: unclassifiedFolderName.value,
    recursive: recursive.value,
    isDryRun: isDryRun,
  };

  try {
    // @ts-ignore
    await window.electronAPI.startLLMOrganization(options);
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] App.vue: LLM ${isDryRun ? "模拟运行" : "整理"}启动失败: ${
        error.message || error
      }`
    );
    organizationProgress.value = `LLM ${
      isDryRun ? "模拟运行" : "整理"
    }启动失败: ${error.message || error}`;
  }
};

// 公共日志记录
const logCommonOrganizationParams = (
  isDryRun: boolean,
  type: "手动" | "LLM"
) => {
  organizationLog.value.unshift(`[INFO] 源目录: ${sourceDirectoryPath.value}`);
  organizationLog.value.unshift(
    `[INFO] 输出目录: ${outputDirectoryPath.value || "源目录"}`
  );
  organizationLog.value.unshift(
    `[INFO] 未分类文件夹名称: ${unclassifiedFolderName.value}`
  );
  organizationLog.value.unshift(
    `[INFO] 递归处理: ${recursive.value ? "是" : "否"}`
  );
  organizationLog.value.unshift(
    `[INFO] ${type}整理模式: ${isDryRun ? "模拟运行" : "实际执行"}`
  );
};

// IPC 进度监听 (保持不变)
let unlistenOrganizationProgress: (() => void) | null = null;
onMounted(() => {
  // @ts-ignore
  if (window.electronAPI && window.electronAPI.onOrganizationProgress) {
    // @ts-ignore
    unlistenOrganizationProgress = window.electronAPI.onOrganizationProgress(
      (progressData: any) => {
        if (progressData.type === "log") {
          organizationLog.value.unshift(
            `[${progressData.level.toUpperCase()}] ${progressData.message}`
          );
        } else if (progressData.type === "status") {
          organizationProgress.value = progressData.message;
          if (
            progressData.message.includes("完成") ||
            progressData.message.includes("失败") ||
            progressData.message.includes("模拟运行")
          ) {
            organizationLog.value.unshift(`[STATUS] ${progressData.message}`);
          }
        } else if (progressData.type === "fileProcessed") {
          const actionText =
            progressData.message && progressData.message.includes("模拟")
              ? "模拟处理"
              : "已处理";
          organizationLog.value.unshift(
            `[INFO] ${actionText}文件 ${progressData.count} 个`
          );
        }
      }
    );
    organizationLog.value.unshift("[INFO] App.vue: 已注册整理进度监听器。");
  } else {
    organizationLog.value.unshift("[ERROR] App.vue: 无法注册整理进度监听器。");
  }
});

onUnmounted(() => {
  if (unlistenOrganizationProgress) {
    unlistenOrganizationProgress();
    organizationLog.value.unshift("[INFO] App.vue: 已取消整理进度监听器。");
  }
});
</script>

<style scoped>
.modern-app {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  background: #f8f9fa;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.main-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 页面切换动画 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
