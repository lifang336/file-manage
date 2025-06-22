// src/main-process-modules/systemFilesFilter.ts

/**
 * 定义需要在文件分类过程中忽略的系统文件和文件夹列表
 * 包括操作系统生成的文件、版本控制文件、IDE配置文件、构建产物等
 */
export const SYSTEM_FILES_TO_IGNORE = [
  // 操作系统生成的文件
  ".ds_store",        // macOS 文件夹视图设置
  "thumbs.db",        // Windows 缩略图缓存
  "desktop.ini",      // Windows 文件夹自定义设置
  
  // 应用自身的文件
  ".file-organizer-logs",  // 本应用的日志文件夹
  
  // 版本控制系统
  ".git",             // Git 版本控制
  ".gitignore",       // Git 忽略文件配置
  ".svn",             // SVN 版本控制
  ".hg",              // Mercurial 版本控制
  
  // 依赖管理
  "node_modules",     // Node.js 依赖包
  
  // IDE 和编辑器配置
  ".vscode",          // Visual Studio Code 配置
  ".idea",            // JetBrains IDE 配置
  
  // Python 相关
  "__pycache__",      // Python 字节码缓存
  ".pytest_cache",    // pytest 测试缓存
  ".coverage",        // Python 代码覆盖率文件
  ".nyc_output",      // NYC 代码覆盖率输出
  "coverage",         // 覆盖率报告文件夹
  
  // 临时文件和缓存
  ".tmp",             // 临时文件夹
  ".temp",            // 临时文件夹
  ".cache",           // 通用缓存文件夹
  ".sass-cache",      // Sass 编译缓存
  ".parcel-cache",    // Parcel 打包工具缓存
  
  // 构建产物
  "dist",             // 分发/构建输出目录
  "build",            // 构建输出目录
  ".next",            // Next.js 构建缓存
  ".nuxt",            // Nuxt.js 构建缓存
  ".output",          // 通用输出目录
  
  // 部署相关
  ".vercel",          // Vercel 部署配置
  ".netlify"          // Netlify 部署配置
];

/**
 * 检查给定的文件或文件夹名称是否应该被忽略
 * @param itemName 文件或文件夹名称
 * @returns 如果应该忽略则返回 true，否则返回 false
 */
export function shouldIgnoreSystemFile(itemName: string): boolean {
  return SYSTEM_FILES_TO_IGNORE.includes(itemName.toLowerCase());
}

/**
 * 过滤掉系统文件的文件名数组
 * @param fileNames 文件名数组
 * @returns 过滤后的文件名数组
 */
export function filterSystemFiles(fileNames: string[]): string[] {
  return fileNames.filter(fileName => !shouldIgnoreSystemFile(fileName));
}
