// src/main-process-modules/directoryLogger.ts
import * as fs from "fs-extra"; // 使用 fs-extra 替代 fs，以便使用 ensureDir 等便捷功能
import * as path from "path";
import { shouldIgnoreSystemFile } from "./systemFilesFilter";

const LOG_SUBFOLDER_NAME = ".file-organizer-logs";

/**
 * 遍历目录并生成 Markdown 格式的目录结构。
 * @param directoryPath 要扫描的目录路径。
 * @param indent 当前缩进级别（用于 Markdown 格式化）。
 * @returns Markdown 格式的目录结构字符串。
 */
async function scanDirectoryToMarkdown(
  directoryPath: string,
  indent = 0
): Promise<string> {
  let markdownContent = "";
  const prefix = "  ".repeat(indent) + "- "; // 根据缩进级别生成 Markdown列表前缀

  try {
    const items = await fs.readdir(directoryPath);
    for (const item of items) {
      // 检查是否应该忽略该条目（系统文件或文件夹）
      if (shouldIgnoreSystemFile(item)) {
        continue;
      }
      const itemPath = path.join(directoryPath, item);
      try {
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          markdownContent += `${prefix}${item}/\n`;
          markdownContent += await scanDirectoryToMarkdown(
            itemPath,
            indent + 1
          ); // 递归扫描子目录
        } else {
          markdownContent += `${prefix}${item}\n`;
        }
      } catch (statError) {
        // 如果无法获取文件/文件夹状态，记录错误并跳过
        console.error(
          `[DirectoryLogger] 无法获取 '${itemPath}' 的状态:`,
          statError
        );
        markdownContent += `${prefix}${item} (无法访问)\n`;
      }
    }
  } catch (readdirError) {
    console.error(
      `[DirectoryLogger] 无法读取目录 '${directoryPath}':`,
      readdirError
    );
    markdownContent += `${prefix}(无法读取此目录内容)\n`;
    throw readdirError; // 将错误向上抛出，以便调用者可以处理
  }
  return markdownContent;
}

/**
 * 记录指定目录的结构到 Markdown 文件。
 * @param sourceDirectoryPath 要记录结构的源目录路径。
 * @param outputDirectoryPath 可选的输出目录路径。如果提供，日志将保存在此目录下的 .file-organizer-logs 子目录中。
 *                            如果未提供，日志将保存在源目录下的 .file-organizer-logs 子目录中。
 * @returns 返回保存的日志文件的完整路径，如果失败则返回 null。
 */
export async function recordOriginalDirectoryStructure(
  sourceDirectoryPath: string,
  outputDirectoryPath?: string
): Promise<string | null> {
  console.log(`[DirectoryLogger] 开始记录目录结构: ${sourceDirectoryPath}`);
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-"); // YYYY-MM-DDTHH-MM-SS-mmmZ
    const dateStamp = now.toISOString().split("T"); // YYYY-MM-DD
    const timeStampForFileName = now.strftime("%Y%m%d_%H%M%S"); // 使用 strftime 兼容的格式

    const markdownHeader = `# 原始目录结构：${sourceDirectoryPath} - ${now.toLocaleString()}\n\n`;
    const markdownBody = await scanDirectoryToMarkdown(sourceDirectoryPath);
    const markdownContent = markdownHeader + markdownBody;

    const logDirParent = outputDirectoryPath || sourceDirectoryPath;
    const logDirPath = path.join(logDirParent, LOG_SUBFOLDER_NAME);

    await fs.ensureDir(logDirPath); // 确保日志子目录存在，如果不存在则创建

    const logFileName = `original_structure_${timeStampForFileName}.md`;
    const logFilePath = path.join(logDirPath, logFileName);

    await fs.writeFile(logFilePath, markdownContent);
    console.log(`[DirectoryLogger] 原始目录结构已保存到: ${logFilePath}`);
    return logFilePath;
  } catch (error) {
    console.error("[DirectoryLogger] 记录原始目录结构失败:", error);
    return null;
  }
}

// 辅助函数，用于格式化日期时间戳 (简单实现，Node.js 默认无 strftime)
// 注意：Date 对象没有 strftime 方法，这里需要一个简单的替代
// 或者可以使用像 date-fns 或 moment.js 这样的库，但为了减少依赖，这里手动实现
if (!Date.prototype.strftime) {
  Date.prototype.strftime = function (format) {
    const date = this as Date;
    // 非常简化的 strftime 实现，仅支持 %Y, %m, %d, %H, %M, %S
    return format.replace(/%[YmdHMS]/g, (match) => {
      switch (match) {
        case "%Y":
          return date.getFullYear().toString();
        case "%m":
          return (date.getMonth() + 1).toString().padStart(2, "0");
        case "%d":
          return date.getDate().toString().padStart(2, "0");
        case "%H":
          return date.getHours().toString().padStart(2, "0");
        case "%M":
          return date.getMinutes().toString().padStart(2, "0");
        case "%S":
          return date.getSeconds().toString().padStart(2, "0");
        default:
          return match;
      }
    });
  };
}
// 声明 Date.prototype.strftime 的类型
declare global {
  interface Date {
    strftime(format: string): string;
  }
}
