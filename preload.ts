// preload.ts
import { contextBridge, ipcRenderer } from "electron";

// 所有 Node.js API 都可以在预加载过程中使用。
// 它拥有与 Chrome 扩展一样的沙盒。

// 安全地将 Electron API 暴露给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 异步函数，用于调用主进程的 'select-directory' IPC 处理程序
  selectDirectory: async (): Promise<string[] | null> => {
    try {
      const filePath = await ipcRenderer.invoke("select-directory");
      return filePath;
    } catch (error) {
      console.error("在 preload 中选择目录时出错:", error);
      return null;
    }
  },

  // 修改：发送手动文件整理请求到主进程 (原 startOrganization)
  startManualOrganization: async (options: any): Promise<void> => {
    try {
      // 'start-manual-organization' 是我们将在主进程中定义的 IPC 通道名称
      await ipcRenderer.invoke("start-manual-organization", options);
    } catch (error) {
      console.error("在 preload 中调用 startManualOrganization 时出错:", error);
      // 将错误重新抛出，以便渲染进程中的调用者可以捕获并处理它
      throw error;
    }
  },

  // 新增：注册监听文件整理进度的回调函数
  // callback 参数是一个函数，它将接收来自主进程的进度数据
  // 返回一个函数，调用该函数可以取消监听
  onOrganizationProgress: (
    callback: (progressData: any) => void
  ): (() => void) => {
    const channel = "organization-progress"; // 主进程将通过此通道发送进度更新

    // 定义一个包装函数，因为 ipcRenderer.on 的回调类型与我们期望的可能不完全匹配
    // Electron.IpcRendererEvent 是事件对象，我们通常只需要第二个参数 data
    const listener = (event: Electron.IpcRendererEvent, data: any) =>
      callback(data);

    // 开始监听指定通道上的消息
    ipcRenderer.on(channel, listener);

    // 返回一个清理函数，允许渲染进程在不再需要时取消监听
    // 这对于防止内存泄漏很重要，尤其是在组件卸载时
    return () => {
      ipcRenderer.removeListener(channel, listener);
      console.log(`已取消对 ${channel} 通道的监听`);
    };
  },

  // 新增：获取 LLM 分类建议
  getLLMCategorySuggestions: async (options: {
    sourceDirectoryPath: string;
    apiKey: string;
    classificationFocus?: string;
    numberOfCategories?: number;
    maxSamples?: number;
    recursive?: boolean;
  }): Promise<string[]> => {
    try {
      const suggestions = await ipcRenderer.invoke(
        "get-llm-category-suggestions",
        options
      );
      return suggestions;
    } catch (error) {
      console.error(
        "在 preload 中调用 getLLMCategorySuggestions 时出错:",
        error
      );
      throw error; // 将错误重新抛出，以便渲染进程可以捕获
    }
  },

  // 新增：发送 LLM 文件整理请求到主进程
  startLLMOrganization: async (options: any): Promise<void> => {
    try {
      await ipcRenderer.invoke("start-llm-organization", options);
    } catch (error) {
      console.error("在 preload 中调用 startLLMOrganization 时出错:", error);
      throw error;
    }
  },

  // 新增：获取快速分类预览
  getQuickOrganizationPreview: async (options: any): Promise<any> => {
    try {
      const result = await ipcRenderer.invoke(
        "quick-organization-preview",
        options
      );
      return result;
    } catch (error) {
      console.error(
        "在 preload 中调用 getQuickOrganizationPreview 时出错:",
        error
      );
      throw error;
    }
  },

  // 新增：执行快速分类
  executeQuickOrganization: async (options: any): Promise<any> => {
    try {
      const result = await ipcRenderer.invoke(
        "quick-organization-execute",
        options
      );
      return result;
    } catch (error) {
      console.error(
        "在 preload 中调用 executeQuickOrganization 时出错:",
        error
      );
      throw error;
    }
  },

  // 新增：设置是否保存目录结构日志
  setSaveDirectoryStructureLog: async (
    enabled: boolean
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await ipcRenderer.invoke(
        "set-save-directory-structure-log",
        enabled
      );
      return result;
    } catch (error) {
      console.error(
        "在 preload 中调用 setSaveDirectoryStructureLog 时出错:",
        error
      );
      throw error;
    }
  },

  // 新增：获取是否保存目录结构日志的设置
  getSaveDirectoryStructureLog: async (): Promise<boolean> => {
    try {
      const enabled = await ipcRenderer.invoke(
        "get-save-directory-structure-log"
      );
      return enabled;
    } catch (error) {
      console.error(
        "在 preload 中调用 getSaveDirectoryStructureLog 时出错:",
        error
      );
      // 如果出错，可以考虑返回一个默认值，例如 true 或 false，或者重新抛出错误
      // 这里我们重新抛出，让渲染进程处理
      throw error;
    }
  },

  // 新增：设置LLM配置
  setLLMConfig: async (
    config: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await ipcRenderer.invoke("set-llm-config", config);
      return result;
    } catch (error) {
      console.error("在 preload 中调用 setLLMConfig 时出错:", error);
      throw error;
    }
  },

  // 新增：获取LLM配置
  getLLMConfig: async (): Promise<any> => {
    try {
      const config = await ipcRenderer.invoke("get-llm-config");
      return config;
    } catch (error) {
      console.error("在 preload 中调用 getLLMConfig 时出错:", error);
      throw error;
    }
  },

  // 新增：获取LLM文件整理预览
  getLLMOrganizationPreview: async (options: any): Promise<any> => {
    try {
      const result = await ipcRenderer.invoke(
        "llm-organization-preview",
        options
      );
      return result;
    } catch (error) {
      console.error(
        "在 preload 中调用 getLLMOrganizationPreview 时出错:",
        error
      );
      throw error;
    }
  },

  // 新增：执行LLM文件整理
  executeLLMOrganization: async (options: any): Promise<any> => {
    try {
      const result = await ipcRenderer.invoke(
        "llm-organization-execute",
        options
      );
      return result;
    } catch (error) {
      console.error("在 preload 中调用 executeLLMOrganization 时出错:", error);
      throw error;
    }
  },
});
