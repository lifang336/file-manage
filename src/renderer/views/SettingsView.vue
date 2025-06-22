<template>
  <div class="settings-view">
    <h2>应用设置</h2>
    <div class="section-box">
      <h3>LLM 配置</h3>
      <div class="form-group">
        <label for="baseUrl">API 基础URL:</label>
        <input
          type="text"
          id="baseUrl"
          v-model="llmConfig.baseUrl"
          placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
        />
      </div>
      <div class="form-group">
        <label for="apiKey">API 密钥:</label>
        <input type="password" id="apiKey" v-model="llmConfig.apiKey" />
      </div>
      <div class="form-group">
        <label for="model">模型名称:</label>
        <input
          type="text"
          id="model"
          v-model="llmConfig.model"
          placeholder="qwen-turbo"
        />
      </div>
      <button @click="saveLLMConfig">保存 LLM 配置</button>
      <p
        v-if="llmConfigStatus"
        :class="{
          'status-success': isLLMConfigSuccess,
          'status-error': !isLLMConfigSuccess,
        }"
      >
        {{ llmConfigStatus }}
      </p>
    </div>

    <div class="section-box">
      <h3>日志设置</h3>
      <div class="form-group">
        <label for="saveLogEnabledInput">
          <input
            type="checkbox"
            id="saveLogEnabledInput"
            v-model="saveLogEnabledInput"
            @change="saveLogSettings"
          />
          启用原始目录结构日志 (在执行实际文件操作前保存)
        </label>
      </div>
      <p
        v-if="saveLogStatus"
        :class="{
          'status-success': isLogSaveSuccess,
          'status-error': !isLogSaveSuccess,
        }"
      >
        {{ saveLogStatus }}
      </p>
    </div>
    <!-- 未来可以添加更多设置项 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";

// LLM配置
const llmConfig = reactive({
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: "",
  model: "qwen-plus-latest",
});
const llmConfigStatus = ref<string>("");
const isLLMConfigSuccess = ref<boolean>(false);

// 日志设置
const saveLogEnabledInput = ref<boolean>(true); // 默认为启用
const saveLogStatus = ref<string>("");
const isLogSaveSuccess = ref<boolean>(false);

// 组件挂载时尝试获取已存储的配置
onMounted(async () => {
  // 获取LLM配置
  try {
    // @ts-ignore
    const storedLLMConfig = await window.electronAPI.getLLMConfig();
    if (storedLLMConfig) {
      llmConfig.baseUrl = storedLLMConfig.baseUrl || llmConfig.baseUrl;
      llmConfig.apiKey = storedLLMConfig.apiKey || llmConfig.apiKey;
      llmConfig.model = storedLLMConfig.model || llmConfig.model;
      console.log("SettingsView: 成功获取已存储的 LLM 配置");
    }
  } catch (error) {
    console.warn(
      "SettingsView: 获取已存储的 LLM 配置失败 (可能尚未设置):",
      error
    );
  }

  // 获取日志设置
  try {
    // @ts-ignore
    const storedSaveLogEnabled =
      await window.electronAPI.getSaveDirectoryStructureLog();
    if (typeof storedSaveLogEnabled === "boolean") {
      saveLogEnabledInput.value = storedSaveLogEnabled;
      console.log("SettingsView: 成功获取已存储的日志设置状态");
    } else {
      // 如果主进程没有存储值，则使用默认值 true，并尝试保存它
      saveLogEnabledInput.value = true; // 确保 UI 反映默认值
      // @ts-ignore
      await window.electronAPI.setSaveDirectoryStructureLog(
        saveLogEnabledInput.value
      );
      console.log(
        "SettingsView: 日志设置状态未找到，使用默认值 true 并已通知主进程。"
      );
      saveLogStatus.value = "日志功能默认已启用。"; // 提示用户
      isLogSaveSuccess.value = true;
    }
  } catch (error) {
    console.warn(
      "SettingsView: 获取日志设置失败 (可能尚未设置，将使用默认值 true):",
      error
    );
    // 如果获取失败，也尝试设置默认值到主进程，并更新UI提示
    saveLogEnabledInput.value = true; // 确保 UI 反映默认值
    try {
      // @ts-ignore
      await window.electronAPI.setSaveDirectoryStructureLog(
        saveLogEnabledInput.value
      );
      console.log(
        "SettingsView: 获取日志设置失败后，已尝试将默认值 true 发送到主进程。"
      );
      saveLogStatus.value =
        "日志功能默认已启用 (获取时发生错误，已重置为默认)。";
      isLogSaveSuccess.value = true;
    } catch (ipcError) {
      console.error(
        "SettingsView: 尝试设置默认日志配置到主进程失败:",
        ipcError
      );
      saveLogStatus.value = "无法与主进程同步日志设置，请稍后重试。";
      isLogSaveSuccess.value = false;
    }
  }
});

// 保存LLM配置
const saveLLMConfig = async () => {
  if (!llmConfig.baseUrl.trim()) {
    llmConfigStatus.value = "API 基础URL不能为空。";
    isLLMConfigSuccess.value = false;
    return;
  }
  if (!llmConfig.apiKey.trim()) {
    llmConfigStatus.value = "API 密钥不能为空。";
    isLLMConfigSuccess.value = false;
    return;
  }
  if (!llmConfig.model.trim()) {
    llmConfigStatus.value = "模型名称不能为空。";
    isLLMConfigSuccess.value = false;
    return;
  }

  try {
    // 将reactive对象转换为普通对象以避免序列化问题
    const configToSave = {
      baseUrl: llmConfig.baseUrl,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
    };

    // @ts-ignore
    await window.electronAPI.setLLMConfig(configToSave);
    llmConfigStatus.value = "LLM 配置已成功保存。";
    isLLMConfigSuccess.value = true;
    console.log("SettingsView: LLM 配置已发送到主进程保存。");
  } catch (error: any) {
    llmConfigStatus.value = `保存 LLM 配置失败: ${error.message || error}`;
    isLLMConfigSuccess.value = false;
    console.error("SettingsView: 保存 LLM 配置时发生错误:", error);
  }
};

const saveLogSettings = async () => {
  try {
    // @ts-ignore
    await window.electronAPI.setSaveDirectoryStructureLog(
      saveLogEnabledInput.value
    );
    saveLogStatus.value = "日志设置已成功更新。";
    isLogSaveSuccess.value = true;
    console.log("SettingsView: 日志设置已发送到主进程保存。");
  } catch (error: any) {
    saveLogStatus.value = `保存日志设置失败: ${error.message || error}`;
    isLogSaveSuccess.value = false;
    console.error("SettingsView: 保存日志设置时发生错误:", error);
  }
};

console.log("SettingsView.vue setup");
</script>

<style scoped>
.settings-view {
  padding: 20px;
}
.section-box {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
  max-width: 600px;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
}
h3 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  /* 使整个标签区域可点击以触发复选框 */
  cursor: pointer;
  display: flex; /* 用于对齐复选框和文本 */
  align-items: center; /* 垂直居中对齐 */
}
.form-group input[type="password"],
.form-group input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-group input[type="checkbox"] {
  margin-right: 8px; /* 在复选框和文本之间添加一些间距 */
  /* 可根据需要调整复选框大小 */
  width: 16px;
  height: 16px;
}
button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  text-align: center;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}
button:hover {
  background-color: #0056b3;
}
.status-success {
  color: green;
  margin-top: 10px;
}
.status-error {
  color: red;
  margin-top: 10px;
}
</style>
