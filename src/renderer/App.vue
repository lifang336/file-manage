<template>
  <div class="modern-app">
    <!-- 侧边栏导航 -->
    <ModernSidebar :current-view="currentView" @navigate="handleNavigate" />

    <!-- 主内容区域 -->
    <div class="main-content">
      <Transition name="page-transition" mode="out-in">
        <!-- 快速分类 -->
        <ManualModeView
          v-if="currentView === 'manual'"
          key="manual"
          :source-directory-path="sourceDirectoryPath"
          :organization-progress="organizationProgress"
          :organization-log="organizationLog"
          @select-source-directory="handleSelectSourceDirectory"
          @start-manual-organization="handleStartQuickOrganization"
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
          @select-source-directory="handleSelectSourceDirectory"
          @update:llm-api-key="llmApiKey = $event"
          @get-llm-suggestions-app="handleGetLLMSuggestions"
          @categories-confirmed-app="handleCategoriesConfirmed"
          @start-llm-organization-app="startLLMOrganization"
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

    <!-- 快速分类预览遮罩 -->
    <div v-if="showQuickPreview" class="preview-overlay">
      <QuickOrganizationPreview
        :preview-data="quickOrganizationPreview"
        :source-directory-path="sourceDirectoryPath || ''"
        :unclassified-folder-name="unclassifiedFolderName"
        @confirm="handleQuickPreviewConfirm"
        @cancel="handleQuickPreviewCancel"
      />
    </div>

    <!-- LLM整理预览遮罩 -->
    <div v-if="showLLMPreview" class="preview-overlay">
      <LLMOrganizationPreview
        :preview-data="llmOrganizationPreview"
        :source-directory-path="sourceDirectoryPath || ''"
        :unclassified-folder-name="unclassifiedFolderName"
        @confirm="handleLLMPreviewConfirm"
        @cancel="handleLLMPreviewCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from "vue";

// 导入组件
import ModernSidebar from "./components/ModernSidebar.vue";
import ManualModeView from "./views/ManualModeView.vue";
import LLMModeView from "./views/LLMModeView.vue";
import SettingsView from "./views/SettingsView.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import QuickOrganizationPreview from "./components/QuickOrganizationPreview.vue";
import LLMOrganizationPreview from "./components/LLMOrganizationPreview.vue";

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

// 导入共享接口
import type { LLMOrganizationOptions } from "../main-process-modules/interfaces";

// 定义 LLM 配置数据的接口 (与 LLMConfig.vue 中 emit 的类型一致)
interface LLMConfigData {
  apiKey: string; // 这个 apiKey 是从 LLMConfig 组件内部发出的，现在需要从 SettingsView 获取
  classificationFocus?: string;
  numberOfCategories?: number;
  maxSamples?: number;
}

// 全局状态
const sourceDirectoryPath = ref<string | null>(null);
const outputDirectoryPath = ref<string | null>(null);
const unclassifiedFolderName = ref<string>("未分类文件");
const recursive = ref<boolean>(true);
const organizationProgress = ref<string | null>(null);
const organizationLog = ref<string[]>([]);
const llmApiKey = ref<string>(""); // API Key 现在由 App.vue 管理，并通过 SettingsView 设置

// 快速分类不需要复杂的规则配置

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

// 从配置文件加载完整配置
const loadAppConfig = async () => {
  try {
    // @ts-ignore
    const storedLLMConfig = await window.electronAPI.getLLMConfig();
    if (storedLLMConfig) {
      if (storedLLMConfig.apiKey) {
        llmApiKey.value = storedLLMConfig.apiKey;
        organizationLog.value.unshift(
          "[INFO] App.vue: 成功从配置文件恢复 API Key。"
        );
      }
      organizationLog.value.unshift(
        `[INFO] App.vue: LLM配置已加载 - 模型: ${storedLLMConfig.model}, 基础URL: ${storedLLMConfig.baseUrl}`
      );
    }
  } catch (error) {
    organizationLog.value.unshift(
      "[WARN] App.vue: 无法从配置文件恢复 LLM 配置 (可能尚未设置)。"
    );
  }
};

// 应用启动时加载配置
onMounted(async () => {
  await loadAppConfig();
});

// 目录选择 (全局)
const handleSelectSourceDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      // 只取第一个路径，确保显示为字符串而不是数组
      sourceDirectoryPath.value = paths[0];
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

// 快速分类预览结果存储
const quickOrganizationPreview = ref<any>(null);
const showQuickPreview = ref(false);

// LLM整理预览结果存储
const llmOrganizationPreview = ref<any>(null);
const showLLMPreview = ref(false);

// 快速分类方法 - 第一步：生成预览
const handleStartQuickOrganization = async (categories: string[]) => {
  if (!sourceDirectoryPath.value) {
    alert("请先选择源文件目录！");
    organizationLog.value.unshift("[ERROR] 快速分类失败：未选择源文件目录。");
    return;
  }
  if (categories.length === 0) {
    alert("请至少添加一个分类名称！");
    organizationLog.value.unshift("[ERROR] 快速分类失败：未添加分类名称。");
    return;
  }

  organizationProgress.value = "正在生成快速分类预览...";
  organizationLog.value.unshift("[INFO] 开始生成快速分类预览...");
  organizationLog.value.unshift(`[INFO] 源目录: ${sourceDirectoryPath.value}`);
  organizationLog.value.unshift(`[INFO] 分类名称: ${categories.join(", ")}`);

  // 确保所有数据都是可序列化的
  const options = {
    sourceDirectoryPath: sourceDirectoryPath.value!,
    categories: [...categories], // 创建新数组避免引用问题
    unclassifiedFolderName: unclassifiedFolderName.value,
    recursive: recursive.value,
  };

  try {
    // @ts-ignore
    const previewResult = await window.electronAPI.getQuickOrganizationPreview(
      options
    );

    if (previewResult.success) {
      quickOrganizationPreview.value = previewResult;
      organizationLog.value.unshift(
        `[SUCCESS] 快速分类预览生成成功，共 ${previewResult.totalFiles} 个文件`
      );
      organizationProgress.value = `快速分类预览生成完成 - 共 ${previewResult.totalFiles} 个文件`;

      // 显示分类统计
      Object.entries(previewResult.categorySummary).forEach(
        ([category, count]) => {
          if ((count as number) > 0) {
            organizationLog.value.unshift(
              `[INFO] ${category}: ${count} 个文件`
            );
          }
        }
      );

      // 显示预览界面
      showQuickPreview.value = true;
    } else {
      organizationLog.value.unshift(
        `[ERROR] 快速分类预览生成失败: ${previewResult.message}`
      );
      organizationProgress.value = `快速分类预览失败: ${previewResult.message}`;
    }
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] 快速分类预览生成失败: ${error.message || error}`
    );
    organizationProgress.value = `快速分类预览失败: ${error.message || error}`;
  }
};

// 快速分类方法 - 第二步：执行分类
const executeQuickOrganization = async () => {
  if (!quickOrganizationPreview.value) {
    organizationLog.value.unshift("[ERROR] 没有可执行的快速分类预览");
    return;
  }

  organizationProgress.value = "正在执行快速分类...";
  organizationLog.value.unshift("[INFO] 开始执行快速分类...");

  // 确保所有数据都是可序列化的，创建纯净的数据副本
  const options = {
    sourceDirectoryPath: sourceDirectoryPath.value!,
    classifications: quickOrganizationPreview.value.classifications.map(
      (item: any) => ({
        filePath: item.filePath,
        fileName: item.fileName,
        relativePath: item.relativePath,
        assignedCategory: item.assignedCategory,
        targetPath: item.targetPath,
      })
    ),
  };

  try {
    // @ts-ignore
    const result = await window.electronAPI.executeQuickOrganization(options);

    if (result.success) {
      organizationLog.value.unshift(`[SUCCESS] ${result.message}`);
      organizationProgress.value = result.message;
    } else {
      organizationLog.value.unshift(`[ERROR] ${result.message}`);
      organizationProgress.value = result.message;
    }

    // 清除预览数据
    quickOrganizationPreview.value = null;
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] 快速分类执行失败: ${error.message || error}`
    );
    organizationProgress.value = `快速分类执行失败: ${error.message || error}`;
  }
};

// 处理快速分类预览确认
const handleQuickPreviewConfirm = async () => {
  showQuickPreview.value = false;
  await executeQuickOrganization();
};

// 处理快速分类预览取消
const handleQuickPreviewCancel = () => {
  showQuickPreview.value = false;
  quickOrganizationPreview.value = null;
  organizationLog.value.unshift("[INFO] 用户取消了快速分类执行");
  organizationProgress.value = "快速分类已取消";
};

// 处理LLM整理预览确认
const handleLLMPreviewConfirm = async () => {
  showLLMPreview.value = false;
  await executeLLMOrganization();
};

// 处理LLM整理预览取消
const handleLLMPreviewCancel = () => {
  showLLMPreview.value = false;
  llmOrganizationPreview.value = null;
  organizationLog.value.unshift("[INFO] 用户取消了LLM整理执行");
  organizationProgress.value = "LLM整理已取消";
};

// 执行LLM整理
const executeLLMOrganization = async () => {
  if (!llmOrganizationPreview.value) {
    organizationLog.value.unshift("[ERROR] 没有可执行的LLM整理预览数据");
    return;
  }

  organizationProgress.value = "正在执行LLM文件整理...";
  organizationLog.value.unshift("[INFO] 开始执行LLM文件整理...");
  organizationLog.value.unshift(
    `[INFO] 将处理 ${llmOrganizationPreview.value.totalFiles} 个文件`
  );

  const options = {
    sourceDirectoryPath: sourceDirectoryPath.value!,
    outputDirectoryPath: llmOrganizationPreview.value.outputDirectoryPath,
    classifications: llmOrganizationPreview.value.classifications,
  };

  try {
    // @ts-ignore
    const result = await window.electronAPI.executeLLMOrganization(options);

    if (result.success) {
      organizationLog.value.unshift(`[SUCCESS] ${result.message}`);
      organizationProgress.value = result.message;

      // 清理预览数据
      llmOrganizationPreview.value = null;
    } else {
      organizationLog.value.unshift(
        `[ERROR] LLM整理执行失败: ${result.message}`
      );
      organizationProgress.value = `LLM整理执行失败: ${result.message}`;
    }
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] LLM整理执行过程中发生错误: ${error.message || error}`
    );
    organizationProgress.value = `LLM整理执行失败: ${error.message || error}`;
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

const startLLMOrganization = async () => {
  if (!sourceDirectoryPath.value) {
    alert("请先选择源文件目录！");
    organizationLog.value.unshift(`[ERROR] LLM 整理失败：未选择源文件目录。`);
    return;
  }
  if (confirmedLLMCategories.value.length === 0) {
    // 检查 App.vue 中的 confirmedLLMCategories
    alert("请先获取并确认 LLM 分类建议！");
    organizationLog.value.unshift(`[ERROR] LLM 整理失败：未确认 LLM 分类。`);
    return;
  }
  if (!llmApiKey.value) {
    // 检查 App.vue 中的 llmApiKey
    alert("API Key 未配置。请在设置页面配置 API Key。");
    organizationLog.value.unshift(`[ERROR] LLM 整理失败：API Key 未配置。`);
    return;
  }

  organizationProgress.value = "正在生成LLM整理预览...";
  organizationLog.value.unshift("[INFO] 开始生成LLM整理预览...");
  organizationLog.value.unshift(`[INFO] 源目录: ${sourceDirectoryPath.value}`);
  organizationLog.value.unshift(
    `[INFO] 输出目录: ${outputDirectoryPath.value || "源目录内"}`
  );
  organizationLog.value.unshift(
    `[INFO] 确认的分类: ${confirmedLLMCategories.value.join(", ")}`
  );

  // 确保所有数据都是可序列化的
  const options = {
    sourceDirectoryPath: sourceDirectoryPath.value!,
    outputDirectoryPath: outputDirectoryPath.value || undefined,
    confirmedCategories: [...confirmedLLMCategories.value], // 创建新数组避免引用问题
    apiKey: llmApiKey.value,
    unclassifiedFolderName: unclassifiedFolderName.value,
    recursive: recursive.value,
  };

  try {
    // @ts-ignore
    const previewResult = await window.electronAPI.getLLMOrganizationPreview(
      options
    );

    if (previewResult.success) {
      llmOrganizationPreview.value = previewResult;
      organizationLog.value.unshift(
        `[SUCCESS] LLM整理预览生成成功，共 ${previewResult.totalFiles} 个文件`
      );
      organizationProgress.value = `LLM整理预览生成完成 - 共 ${previewResult.totalFiles} 个文件`;

      // 显示分类统计
      Object.entries(previewResult.categorySummary).forEach(
        ([category, count]) => {
          if ((count as number) > 0) {
            organizationLog.value.unshift(
              `[INFO] ${category}: ${count} 个文件`
            );
          }
        }
      );

      // 显示预览界面
      showLLMPreview.value = true;
    } else {
      organizationLog.value.unshift(
        `[ERROR] LLM整理预览生成失败: ${previewResult.message}`
      );
      organizationProgress.value = `LLM整理预览失败: ${previewResult.message}`;
    }
  } catch (error: any) {
    organizationLog.value.unshift(
      `[ERROR] LLM整理预览生成失败: ${error.message || error}`
    );
    organizationProgress.value = `LLM整理预览失败: ${error.message || error}`;
  }
};

// 公共日志记录
const logCommonOrganizationParams = (type: "手动" | "LLM") => {
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
  organizationLog.value.unshift(`[INFO] ${type}整理模式: 实际执行`);
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

/* 预览遮罩样式 */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
</style>
