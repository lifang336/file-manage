import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // 解决 Electron 环境下路径问题
  base: "/", // 开发模式下，资源应该从根路径提供
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist/renderer", // 指定渲染进程的输出目录
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["electron"],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          electron: "electron",
        },
      },
    },
  },
  // 为开发服务器配置
  server: {
    // Electron 通常在 file:// 协议下运行，但 Vite 开发服务器使用 http://
    // HMR 需要一个稳定的入口点
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
  },
});
