// src/main-process-modules/windowManager.ts
import { BrowserWindow } from "electron";
import * as path from "path";

/**
 * @function createWindow
 * @description 创建并配置应用的主浏览器窗口。
 *              根据环境变量 NODE_ENV 加载开发或生产版本的渲染进程URL/文件。
 */
export function createWindow(): BrowserWindow {
  const mainWindow: BrowserWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    show: false, // 先不显示，等加载完成后再显示
    titleBarStyle: "default",
    webPreferences: {
      // __dirname 在编译后指向 dist/src/main-process-modules/
      // preload.js 位于 dist/ 目录下，所以需要向上两级目录
      // 使用相对路径 "../../preload.js" 来正确指向 preload.js
      preload: path.join(__dirname, "../../preload.js"), // 指定预加载脚本
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 窗口加载完成后显示，避免白屏
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // 居中显示窗口
    mainWindow.center();
  });

  // 窗口状态管理
  mainWindow.on("resize", () => {
    // 保存窗口大小状态
    const bounds = mainWindow.getBounds();
    // 这里可以保存到配置文件中
    console.log("窗口大小变化:", bounds);
  });

  // 防止窗口过小
  mainWindow.on("will-resize", (event, newBounds) => {
    if (newBounds.width < 1000 || newBounds.height < 700) {
      event.preventDefault();
    }
  });

  // 调试日志：输出 NODE_ENV 的值
  console.log(`[WindowManager] NODE_ENV: ${process.env.NODE_ENV}`);

  // 根据环境加载不同的 URL
  if (process.env.NODE_ENV === "development") {
    const devUrl = "http://localhost:5173"; // Vite 开发服务器地址
    console.log(`[WindowManager] Loading URL for development: ${devUrl}`);
    mainWindow.loadURL(devUrl);
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 在生产环境中，index.html 位于 dist/renderer/index.html
    // __dirname 在编译后指向 dist/src/main-process-modules/
    // 需要向上两级目录到 dist/，然后进入 renderer/ 目录
    const prodFile = path.join(__dirname, "../../renderer/index.html");
    console.log(`[WindowManager] Loading file for production: ${prodFile}`);
    console.log(`[WindowManager] __dirname: ${__dirname}`);
    mainWindow.loadFile(prodFile);
  }

  // 如果需要在生产模式下也打开开发者工具，取消下一行注释
  // mainWindow.webContents.openDevTools();

  return mainWindow;
}
