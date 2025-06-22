import { app, BrowserWindow, ipcMain, dialog } from "electron"; // 导入 ipcMain 和 dialog
import * as path from "path";
import * as fs from "fs"; // 文件系统模块
import { Stats } from "fs"; // 用于类型提示
import OpenAI from "openai"; // 导入 OpenAI 库
import { createWindow } from "./src/main-process-modules/windowManager";
import {
  registerSelectDirectoryHandler,
  registerLogSettingsHandlers, // 新增：导入日志设置处理器注册函数
  registerLLMConfigHandlers, // 新增：导入LLM配置处理器注册函数
} from "./src/main-process-modules/ipcGeneralHandlers";
import { registerManualOrganizationHandler } from "./src/main-process-modules/manualOrganizationService";
import {
  registerGetLLMCategorySuggestionsHandler,
  registerStartLLMOrganizationHandler,
} from "./src/main-process-modules/ipcLLMHandlers";
import {
  ClassificationRule,
  ManualOrganizationOptions,
  LLMOrganizationOptions,
  LLMCategoryOptions,
} from "./src/main-process-modules/interfaces";

// 主要应用逻辑和 IPC Handler 已迁移到 src/main-process-modules/ 目录下对应的模块中。
// main.ts 现在主要负责：
// 1. 导入必要的 Electron 组件和新创建的模块。
// 2. 在应用准备就绪时，创建窗口并注册所有 IPC Handlers。
// 3. 处理应用生命周期事件，如窗口激活和所有窗口关闭。

// Electron 应用就绪后执行
app.whenReady().then(() => {
  createWindow();
  registerSelectDirectoryHandler();

  registerLogSettingsHandlers(); // 新增：注册日志设置处理器
  registerLLMConfigHandlers(); // 新增：注册LLM配置处理器
  registerManualOrganizationHandler();
  registerGetLLMCategorySuggestionsHandler();
  registerStartLLMOrganizationHandler();

  app.on("activate", () => {
    // 在 macOS 系统上，当单击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用 (Windows & Linux)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit(); // macOS 上例外
  }
});
