// src/main-process-modules/ipcGeneralHandlers.ts
import { ipcMain, dialog, BrowserWindow } from "electron"; // 确保 BrowserWindow 被导入，如果计划在 register 函数中使用
import { LLMConfig } from "./interfaces";
import {
  loadConfig,
  saveConfig,
  updateConfig,
  AppConfig,
} from "./configService";

// 新增：用于临时存储“保存目录结构日志”设置的变量
let saveDirectoryStructureLogEnabled = true; // 默认为启用

// 新增：用于临时存储LLM配置的变量
let tempLLMConfig: LLMConfig = {
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", // 默认使用阿里云DashScope
  apiKey: "",
  model: "qwen-plus-latest", // 默认使用通义千问Plus模型
};

/**
 * @function registerSelectDirectoryHandler
 * @description 注册用于处理选择目录请求的 IPC Handler。
 *              当渲染进程发送 "select-directory" 事件时，打开一个对话框供用户选择目录。
 */
export function registerSelectDirectoryHandler(): void {
  ipcMain.handle("select-directory", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (canceled || filePaths.length === 0) {
      console.log(
        "[IpcGeneralHandlers] Directory selection cancelled by user."
      );
      return null; // 如果用户取消或未选择文件，则返回 null
    }
    console.log(`[IpcGeneralHandlers] Directory selected: ${filePaths[0]}`);
    return filePaths; // 返回选择的第一个目录路径字符串
  });
  console.log(
    "[IpcGeneralHandlers] 'select-directory' IPC handler registered."
  );
}

/**
 * @function registerLogSettingsHandlers
 * @description 注册用于处理日志相关设置的 IPC Handlers。
 */
export function registerLogSettingsHandlers(): void {
  // 处理设置“保存目录结构日志”的请求
  ipcMain.handle(
    "set-save-directory-structure-log",
    async (_event, enabled: boolean) => {
      if (typeof enabled === "boolean") {
        saveDirectoryStructureLogEnabled = enabled;
        console.log(
          `[IpcGeneralHandlers] 保存目录结构日志功能设置为: ${saveDirectoryStructureLogEnabled}`
        );
        // 在实际应用中，这里应该将设置持久化保存
        // 例如: await settings.set('saveDirectoryStructureLogEnabled', enabled);
        return { success: true, message: "日志设置已更新。" };
      }
      console.warn(
        "[IpcGeneralHandlers] set-save-directory-structure-log: 无效的 enabled 值:",
        enabled
      );
      return { success: false, message: "无效的设置值。" };
    }
  );

  // 处理获取“保存目录结构日志”设置的请求
  ipcMain.handle("get-save-directory-structure-log", async () => {
    console.log(
      `[IpcGeneralHandlers] 获取目录结构日志功能状态: ${saveDirectoryStructureLogEnabled}`
    );
    // 在实际应用中，这里应该从持久化存储中读取设置
    // 例如: const setting = await settings.get('saveDirectoryStructureLogEnabled');
    // return typeof setting === 'boolean' ? setting : true; // 返回存储值或默认值 true
    return saveDirectoryStructureLogEnabled;
  });

  console.log(
    "[IpcGeneralHandlers] 'set-save-directory-structure-log' and 'get-save-directory-structure-log' IPC handlers registered."
  );
}

/**
 * @function getShouldSaveDirectoryStructureLog
 * @description 获取当前是否启用了“保存原始目录结构日志”的设置。
 * @returns {boolean} 如果启用了则返回 true，否则返回 false。
 */
export function getShouldSaveDirectoryStructureLog(): boolean {
  return saveDirectoryStructureLogEnabled;
}

/**
 * @function registerLLMConfigHandlers
 * @description 注册用于处理LLM配置设置和获取的 IPC Handlers。
 */
export function registerLLMConfigHandlers(): void {
  // 处理设置LLM配置的请求
  ipcMain.handle(
    "set-llm-config",
    async (_event, config: Partial<LLMConfig>) => {
      try {
        // 更新配置，保留未提供的字段的原值
        if (config.baseUrl !== undefined) {
          tempLLMConfig.baseUrl = config.baseUrl;
        }
        if (config.apiKey !== undefined) {
          tempLLMConfig.apiKey = config.apiKey;
        }
        if (config.model !== undefined) {
          tempLLMConfig.model = config.model;
        }

        console.log("[IpcGeneralHandlers] LLM配置已更新:", {
          baseUrl: tempLLMConfig.baseUrl,
          apiKeyLength: tempLLMConfig.apiKey?.length || 0,
          model: tempLLMConfig.model,
        });
        return { success: true };
      } catch (error: any) {
        console.error("[IpcGeneralHandlers] 设置LLM配置时出错:", error);
        return { success: false, error: error.message };
      }
    }
  );

  // 处理获取LLM配置的请求
  ipcMain.handle("get-llm-config", async () => {
    try {
      console.log("[IpcGeneralHandlers] LLM配置已获取");
      return tempLLMConfig;
    } catch (error: any) {
      console.error("[IpcGeneralHandlers] 获取LLM配置时出错:", error);
      return null;
    }
  });

  console.log(
    "[IpcGeneralHandlers] 'set-llm-config' and 'get-llm-config' IPC handlers registered."
  );
}

/**
 * @function getLLMConfig
 * @description 获取当前的LLM配置。
 * @returns {LLMConfig} 当前的LLM配置。
 */
export function getLLMConfig(): LLMConfig {
  return tempLLMConfig;
}

// 注意：确保在你的主进程初始化代码中 (例如 main.ts) 调用所有这些注册函数：
// import { registerSelectDirectoryHandler, registerApiKeyHandlers, registerLogSettingsHandlers } from './ipcGeneralHandlers';
//
// app.whenReady().then(() => {
//   createWindow(); // 假设这是创建 BrowserWindow 实例的函数
//   registerSelectDirectoryHandler();
//   registerApiKeyHandlers();
//   registerLogSettingsHandlers(); // 新增调用
//   // ... 其他初始化代码
// });
