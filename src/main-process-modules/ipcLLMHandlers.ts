// src/main-process-modules/ipcLLMHandlers.ts
import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import {
  LLMCategoryOptions,
  LLMOrganizationOptions,
  QuickOrganizationOptions,
  QuickOrganizationPreviewOptions,
  QuickOrganizationPreview,
  QuickOrganizationExecuteOptions,
  LLMOrganizationPreviewOptions,
  LLMOrganizationPreview,
  LLMOrganizationExecuteOptions,
  FileClassificationItem,
} from "./interfaces"; // 从共享接口模块导入
import { getSuggestionsFromLLM, getClassifyResultFromLLM } from "./llmService"; // 从 LLM 服务模块导入
import {
  getShouldSaveDirectoryStructureLog,
  getLLMConfig,
} from "./ipcGeneralHandlers"; // 新增：导入获取日志设置和LLM配置的函数
import { recordOriginalDirectoryStructure } from "./directoryLogger"; // 新增：导入目录日志记录函数
import { shouldIgnoreSystemFile } from "./systemFilesFilter";

/**
 * 清理空目录
 * @param sourceDirectoryPath 源目录路径
 * @param originalFilePaths 原始文件路径集合
 * @param sendLog 日志发送函数
 */
async function cleanupEmptyDirectories(
  sourceDirectoryPath: string,
  originalFilePaths: Set<string>,
  sendLog: (message: string, type?: "info" | "error" | "success") => void
): Promise<void> {
  const dirsToCheck = Array.from(originalFilePaths).sort(
    (a, b) => b.length - a.length
  ); // 从最深的目录开始检查

  for (const dirPath of dirsToCheck) {
    try {
      // 跳过源目录本身
      if (dirPath === sourceDirectoryPath) {
        continue;
      }

      // 检查目录是否存在
      if (!fs.existsSync(dirPath)) {
        continue;
      }

      // 检查目录是否为空（忽略系统文件）
      const entries = fs.readdirSync(dirPath);
      const nonSystemEntries = entries.filter(
        (entry) => !shouldIgnoreSystemFile(entry)
      );

      if (nonSystemEntries.length === 0) {
        // 目录为空，删除它
        fs.rmdirSync(dirPath);
        const relativePath = path.relative(sourceDirectoryPath, dirPath);
        sendLog(`删除空目录: ${relativePath}`, "success");
      }
    } catch (error: any) {
      const relativePath = path.relative(sourceDirectoryPath, dirPath);
      sendLog(`删除目录失败: ${relativePath}. 错误: ${error.message}`, "error");
    }
  }
}

// --- 缓存相关变量 ---
// 这些缓存在 main.ts 中定义，理想情况下应该也移到专门的缓存模块或由 LLM 相关服务管理。
// 但为了逐步重构，暂时假设这些变量在调用这些 handler 时可以被访问或通过参数传递。
// 为简化当前步骤，我们先在 main.ts 中保留这些缓存变量的声明和管理，
// ipcLLMHandlers.ts 中的函数会接收必要的缓存实例或通过某种方式访问它们。
// 在此模块中，我们仅定义 IPC Handler 逻辑，并假设缓存由外部管理。

// 用于缓存 LLM 全局分类建议
let llmCategorySuggestionsCache: {
  options: LLMCategoryOptions | null;
  suggestions: string[];
} = { options: null, suggestions: [] };

/**
 * @function registerGetLLMCategorySuggestionsHandler
 * @description 注册用于处理获取 LLM 分类建议请求的 IPC Handler。
 */
export function registerGetLLMCategorySuggestionsHandler(): void {
  ipcMain.handle(
    "get-llm-category-suggestions",
    async (event, options: LLMCategoryOptions) => {
      const {
        sourceDirectoryPath,
        apiKey,
        classificationFocus,
        numberOfCategories,
        maxSamples = 100,
        recursive = true,
      } = options;

      const sender = event.sender;
      const log = (message: string, level: "info" | "error" = "info") => {
        console.log(`[IPC LLM Suggestions] ${level.toUpperCase()}: ${message}`);
        sender.send("llm-discovery-log", { level, message });
      };

      log(
        `Received LLM category suggestions request. Source: ${sourceDirectoryPath}, API Key Length: ${apiKey?.length}`
      );

      // 检查缓存 (与 main.ts 中逻辑类似)
      if (
        llmCategorySuggestionsCache.options &&
        llmCategorySuggestionsCache.options.sourceDirectoryPath ===
          sourceDirectoryPath &&
        llmCategorySuggestionsCache.options.apiKey === apiKey &&
        llmCategorySuggestionsCache.options.classificationFocus ===
          classificationFocus &&
        llmCategorySuggestionsCache.options.numberOfCategories ===
          numberOfCategories &&
        llmCategorySuggestionsCache.options.maxSamples === maxSamples &&
        llmCategorySuggestionsCache.options.recursive === recursive &&
        llmCategorySuggestionsCache.suggestions.length > 0
      ) {
        log("Reusing cached LLM category suggestions.", "info");
        return llmCategorySuggestionsCache.suggestions;
      }

      if (!sourceDirectoryPath || !fs.existsSync(sourceDirectoryPath)) {
        log(`Invalid source directory: ${sourceDirectoryPath}`, "error");
        throw new Error("Invalid or non-existent source directory.");
      }
      if (!apiKey) {
        log(`API Key not provided.`, "error");
        throw new Error("API Key not provided.");
      }

      const collectedFileNames: string[] = [];
      const collectFileNames = (dirPath: string) => {
        if (collectedFileNames.length >= maxSamples) return;
        try {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (collectedFileNames.length >= maxSamples) break;
            const fullPath = path.join(dirPath, entry.name);

            // 检查是否应该忽略该条目（系统文件或文件夹）
            if (shouldIgnoreSystemFile(entry.name)) {
              continue;
            }

            if (entry.isFile()) {
              collectedFileNames.push(entry.name);
            } else if (entry.isDirectory() && recursive) {
              collectFileNames(fullPath);
            }
          }
        } catch (err: any) {
          log(`Error reading directory ${dirPath}: ${err.message}`, "error");
        }
      };

      try {
        log("Collecting file name samples...");
        collectFileNames(sourceDirectoryPath);
        log(`Collected ${collectedFileNames.length} file name samples.`);
        if (collectedFileNames.length === 0) {
          log("No file name samples collected.", "info");
          return [];
        }

        const promptMessages = [
          {
            role: "system" as const,
            content:
              "你是一个智能助手，专门根据用户提供的文件名样本和分类焦点生成JSON格式的文件夹分类名称列表。请使用中文生成分类名称。",
          },
          {
            role: "user" as const,
            content: `基于以下文件名样本：\n\n${collectedFileNames
              .slice(0, maxSamples)
              .join("\n")}\n\n考虑分类焦点（如果提供）：'${
              classificationFocus || "无特定焦点"
            }'，请生成 ${
              numberOfCategories || "大约5-7个"
            } 个合适的文件夹分类名称。\n\n请严格按照JSON格式的字符串数组返回结果，例如：["图片", "文档", "工作文件"]。不要包含任何额外的解释或文字，只返回JSON数组。所有分类名称必须使用中文。`,
          },
        ];

        log("Calling LLM service for suggestions...");

        // 获取LLM配置
        const llmConfig = getLLMConfig();
        const baseUrl = options.baseUrl || llmConfig.baseUrl;
        const model = options.model || llmConfig.model;

        // 添加详细的调试日志
        log(
          `[DEBUG] LLM Config - BaseURL: ${baseUrl}, Model: ${model}`,
          "info"
        );
        log(`[DEBUG] API Key length: ${apiKey?.length || 0}`, "info");
        log(`[DEBUG] Prompt Messages:`, "info");
        log(`[DEBUG] System: ${promptMessages[0].content}`, "info");
        log(
          `[DEBUG] User: ${promptMessages[1].content.substring(0, 500)}...`,
          "info"
        );

        const suggestions = await getSuggestionsFromLLM(
          apiKey,
          promptMessages,
          model,
          baseUrl
        );
        log(`LLM service returned ${suggestions.length} suggestions.`);
        log(
          `[DEBUG] Raw LLM suggestions response: ${JSON.stringify(
            suggestions
          )}`,
          "info"
        );

        // 更新缓存
        llmCategorySuggestionsCache = { options, suggestions };
        log("LLM category suggestions cached.", "info");
        return suggestions;
      } catch (error: any) {
        log(
          `Error getting LLM category suggestions: ${error.message}`,
          "error"
        );
        throw new Error(
          `Failed to get LLM category suggestions: ${error.message}`
        );
      }
    }
  );
  console.log(
    "[IPCLLMHandlers] 'get-llm-category-suggestions' IPC handler registered."
  );
}

/**
 * @function registerStartLLMOrganizationHandler
 * @description 注册用于处理基于 LLM 的文件整理请求的 IPC Handler。
 */
export function registerStartLLMOrganizationHandler(): void {
  ipcMain.handle(
    "start-llm-organization",
    async (event, options: LLMOrganizationOptions) => {
      const {
        sourceDirectoryPath,
        outputDirectoryPath,
        confirmedCategories,
        apiKey,
        unclassifiedFolderName,
        recursive,
      } = options;

      const sender = event.sender;

      const sendLog = (
        message: string,
        type: "info" | "error" | "success" = "info"
      ) => {
        console.log(`[LLM文件整理] ${type.toUpperCase()}: ${message}`);
        sender.send("organization-progress", {
          type: "log",
          message: message,
          level: type,
        });
      };

      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      let processedFileCount = 0;
      const sendFileProcessedUpdate = () => {
        processedFileCount++;
        sender.send("organization-progress", {
          type: "fileProcessed",
          count: processedFileCount,
          message: "已处理",
        });
      };

      sendLog(`开始LLM文件整理，源目录: ${sourceDirectoryPath}`);

      // 新增：在实际操作前记录原始目录结构
      if (getShouldSaveDirectoryStructureLog()) {
        try {
          sendLog("正在记录原始目录结构...", "info");
          const logFilePath = await recordOriginalDirectoryStructure(
            sourceDirectoryPath,
            outputDirectoryPath === null ? undefined : outputDirectoryPath
          );
          if (logFilePath) {
            sendLog(`原始目录结构已保存到: ${logFilePath}`, "success");
          } else {
            sendLog("记录原始目录结构失败，但整理操作将继续。", "error");
          }
        } catch (logError: any) {
          sendLog(
            `记录原始目录结构时发生错误: ${logError.message}，整理操作将继续。`,
            "error"
          );
        }
      }

      sendLog("开始LLM文件分类...", "info");

      const baseTargetDir = outputDirectoryPath || sourceDirectoryPath;
      if (outputDirectoryPath && !fs.existsSync(outputDirectoryPath)) {
        try {
          fs.mkdirSync(outputDirectoryPath, { recursive: true });
          sendLog(
            `Created output directory: ${outputDirectoryPath}`,
            "success"
          );
        } catch (error: any) {
          sendLog(
            `Failed to create output directory: ${error.message}`,
            "error"
          );
          return {
            success: false,
            message: `Failed to create output directory: ${error.message}`,
          };
        }
      }

      async function organizeDirectoryLLM(
        currentSourceDir: string,
        currentRelativePath: string = ""
      ) {
        const entries = fs.readdirSync(currentSourceDir, {
          withFileTypes: true,
        });
        for (const entry of entries) {
          const entryName = entry.name;
          const fullSourcePath = path.join(currentSourceDir, entryName);

          // 检查是否应该忽略该条目 (系统文件或日志文件夹本身)
          if (
            shouldIgnoreSystemFile(entryName) ||
            (entry.isDirectory() &&
              entryName === ".file-organizer-logs" &&
              (outputDirectoryPath
                ? path.dirname(fullSourcePath) === outputDirectoryPath
                : path.dirname(fullSourcePath) === sourceDirectoryPath))
          ) {
            sendLog(
              `Skipping specific file/folder (LLM): ${fullSourcePath}`,
              "info"
            );
            continue;
          }

          if (
            recursive &&
            outputDirectoryPath &&
            fullSourcePath === outputDirectoryPath &&
            outputDirectoryPath.startsWith(sourceDirectoryPath)
          ) {
            sendLog(
              `Skipping output directory itself: ${fullSourcePath}`,
              "info"
            );
            continue;
          }

          if (entry.isDirectory()) {
            if (recursive) {
              sendLog(`Entering subdirectory: ${entryName}`);
              await organizeDirectoryLLM(
                fullSourcePath,
                path.join(currentRelativePath, entryName)
              );
            } else {
              sendLog(`Skipping subdirectory (non-recursive): ${entryName}`);
            }
          } else if (entry.isFile()) {
            sendLog(`Processing file: ${entryName}`);
            let llmAssignedCategory: string | null = null;

            // 直接进行 LLM 分类，不使用缓存
            sendLog(`Classifying file "${entryName}" with LLM...`, "info");
            const fileExtension = path.extname(entryName).toLowerCase();

            // 添加调试日志：显示确认的分类列表
            sendLog(
              `[DEBUG] Confirmed categories for classification: ${JSON.stringify(
                confirmedCategories
              )}`,
              "info"
            );

            const promptMessages = [
              {
                role: "system" as const,
                content: `你是一个文件分类助手。根据文件名${
                  fileExtension ? `（推断文件类型为 ${fileExtension}）` : ""
                }和给定的分类列表，将文件分配到最合适的分类中。如果没有合适的分类，请回复"未分类"。只返回一个词：分类名称或"未分类"。注意分类使用中文。`,
              },
              {
                role: "user" as const,
                content: `文件名："${entryName}"。\n请从以下列表中选择最合适的分类：\n${confirmedCategories.join(
                  "\n"
                )}\n如果没有合适的分类，请回复"未分类"。`,
              },
            ];

            // 获取LLM配置
            const llmConfig = getLLMConfig();
            const baseUrl = options.baseUrl || llmConfig.baseUrl;
            const model = options.model || llmConfig.model;

            // 添加调试日志：显示分类请求的详细信息
            sendLog(
              `[DEBUG] File classification request for "${entryName}":`,
              "info"
            );
            sendLog(
              `[DEBUG] System prompt: ${promptMessages[0].content}`,
              "info"
            );
            sendLog(
              `[DEBUG] User prompt: ${promptMessages[1].content}`,
              "info"
            );
            sendLog(
              `[DEBUG] Using model: ${model}, baseUrl: ${baseUrl}`,
              "info"
            );

            llmAssignedCategory = await getClassifyResultFromLLM(
              apiKey,
              promptMessages,
              confirmedCategories,
              model,
              baseUrl
            );

            // 添加调试日志：显示LLM的原始响应
            sendLog(
              `[DEBUG] Raw LLM classification response for "${entryName}": "${llmAssignedCategory}"`,
              "info"
            );
            sendLog(
              `File "${entryName}" LLM classified as: "${
                llmAssignedCategory || unclassifiedFolderName
              }"`,
              "info"
            );

            const targetFolderName =
              llmAssignedCategory || unclassifiedFolderName;
            const targetDir = path.join(
              baseTargetDir,
              currentRelativePath,
              targetFolderName
            );

            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
              sendLog(`Created directory (LLM): ${targetDir}`, "success");
            }

            let targetFilePath = path.join(targetDir, entryName);
            let counter = 1;
            const originalName = path.parse(entryName).name;
            const originalExt = path.parse(entryName).ext;
            let isRenamed = false;

            const checkFileExists = (filePathToCheck: string) => {
              // 如果源路径和目标路径相同（例如，文件已在目标位置且未重命名），则不应视为“存在冲突”
              if (fullSourcePath === filePathToCheck) return false;
              return fs.existsSync(filePathToCheck);
            };

            while (checkFileExists(targetFilePath)) {
              targetFilePath = path.join(
                targetDir,
                `${originalName}_${counter}${originalExt}`
              );
              counter++;
              isRenamed = true;
            }

            // 再次检查目标路径是否与源路径相同，避免不必要的移动
            if (fullSourcePath === targetFilePath) {
              sendLog(
                `File "${entryName}" is already in the target location "${targetFilePath}" (LLM), no move needed.`,
                "info"
              );
              sendFileProcessedUpdate(); // Still count as processed
              continue;
            }
            try {
              fs.renameSync(fullSourcePath, targetFilePath);
              sendLog(
                `Moved file (LLM): "${entryName}" ${
                  isRenamed
                    ? `and renamed to "${path.basename(targetFilePath)}"`
                    : ""
                } to "${targetDir}"`,
                "success"
              );
              sendFileProcessedUpdate();
            } catch (moveError: any) {
              sendLog(
                `Failed to move file "${entryName}" (LLM): ${moveError.message}`,
                "error"
              );
            }
          }
        }
      } // End of organizeDirectoryLLM

      try {
        sendStatus("LLM organization in progress...");
        await organizeDirectoryLLM(sourceDirectoryPath);
        sendStatus("LLM organization complete!");
        sendLog("All files processed with LLM.", "success");

        const finalMessage = "LLM file organization completed successfully.";
        return { success: true, message: finalMessage };
      } catch (error: any) {
        sendLog(
          `Critical error during LLM organization: ${error.message}`,
          "error"
        );
        sendStatus("LLM organization failed.");
        return {
          success: false,
          message: `LLM organization failed: ${error.message}`,
        };
      }
    }
  );
  console.log(
    "[IPCLLMHandlers] 'start-llm-organization' IPC handler registered."
  );
}

/**
 * @function registerQuickOrganizationPreviewHandler
 * @description 注册用于处理快速分类预览请求的 IPC Handler。
 */
export function registerQuickOrganizationPreviewHandler(): void {
  ipcMain.handle(
    "quick-organization-preview",
    async (event, options: QuickOrganizationPreviewOptions) => {
      const {
        sourceDirectoryPath,
        categories,
        unclassifiedFolderName,
        recursive,
      } = options;

      const sender = event.sender;

      const sendLog = (
        message: string,
        type: "info" | "error" | "success" = "info"
      ) => {
        console.log(`[快速分类预览] ${type.toUpperCase()}: ${message}`);
        sender.send("organization-progress", {
          type: "log",
          message: message,
          level: type,
        });
      };

      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      sendLog(`开始快速分类预览，源目录: ${sourceDirectoryPath}`);
      sendLog(`分类列表: ${categories.join(", ")}`);

      // 获取LLM配置
      const llmConfig = getLLMConfig();
      if (!llmConfig.apiKey) {
        const errorMsg = "LLM API密钥未配置，无法进行快速分类预览。";
        sendLog(errorMsg, "error");
        return {
          success: false,
          message: errorMsg,
          classifications: [],
          categorySummary: {},
          totalFiles: 0,
        };
      }

      sendLog("开始收集文件并进行分类预览...", "info");
      sendStatus("正在分析文件并生成分类预览...");

      const classifications: FileClassificationItem[] = [];
      const categorySummary: { [category: string]: number } = {};

      // 初始化分类统计
      categories.forEach((category) => {
        categorySummary[category] = 0;
      });
      categorySummary[unclassifiedFolderName] = 0;

      async function collectAndClassifyFiles(
        currentSourceDir: string,
        currentRelativePath: string = ""
      ) {
        const entries = fs.readdirSync(currentSourceDir, {
          withFileTypes: true,
        });

        for (const entry of entries) {
          const entryName = entry.name;
          const fullSourcePath = path.join(currentSourceDir, entryName);
          const relativePath = currentRelativePath
            ? path.join(currentRelativePath, entryName)
            : entryName;

          // 跳过系统文件
          if (shouldIgnoreSystemFile(entryName)) {
            sendLog(`跳过系统文件: ${entryName}`);
            continue;
          }

          if (entry.isDirectory()) {
            if (recursive) {
              sendLog(`进入子目录: ${entryName}`);
              await collectAndClassifyFiles(fullSourcePath, relativePath);
            } else {
              sendLog(`跳过子目录（非递归模式）: ${entryName}`);
            }
          } else if (entry.isFile()) {
            sendLog(`正在分析文件: ${relativePath}`);

            // 使用 LLM 进行分类
            const fileExtension = path.extname(entryName).toLowerCase();

            const promptMessages = [
              {
                role: "system" as const,
                content: `你是一个文件分类助手。根据文件名${
                  fileExtension ? `（推断文件类型为 ${fileExtension}）` : ""
                }和给定的分类列表，将文件分配到最合适的分类中。如果没有合适的分类，请回复"未分类"。只返回一个词：分类名称或"未分类"。注意分类使用中文。`,
              },
              {
                role: "user" as const,
                content: `文件名："${entryName}"。\n请从以下列表中选择最合适的分类：\n${categories.join(
                  "\n"
                )}\n如果没有合适的分类，请回复"未分类"。`,
              },
            ];

            const llmAssignedCategory = await getClassifyResultFromLLM(
              llmConfig.apiKey,
              promptMessages,
              categories,
              llmConfig.model,
              llmConfig.baseUrl
            );

            const assignedCategory =
              llmAssignedCategory || unclassifiedFolderName;
            const targetPath = path.join(
              sourceDirectoryPath,
              assignedCategory,
              entryName
            );

            // 添加到分类结果
            classifications.push({
              filePath: fullSourcePath,
              fileName: entryName,
              relativePath: relativePath,
              assignedCategory: assignedCategory,
              targetPath: targetPath,
            });

            // 更新统计
            categorySummary[assignedCategory] =
              (categorySummary[assignedCategory] || 0) + 1;

            sendLog(`文件 "${relativePath}" 预分类为: "${assignedCategory}"`);
          }
        }
      }

      try {
        await collectAndClassifyFiles(sourceDirectoryPath);

        const totalFiles = classifications.length;
        sendLog(`分类预览完成，共分析 ${totalFiles} 个文件`, "success");
        sendStatus("分类预览生成完成");

        // 生成分类统计日志
        Object.entries(categorySummary).forEach(([category, count]) => {
          if (count > 0) {
            sendLog(`${category}: ${count} 个文件`);
          }
        });

        return {
          success: true,
          message: `成功生成分类预览，共 ${totalFiles} 个文件`,
          classifications: classifications,
          categorySummary: categorySummary,
          totalFiles: totalFiles,
        };
      } catch (error: any) {
        sendLog(`分类预览过程中发生错误: ${error.message}`, "error");
        sendStatus("分类预览失败");
        return {
          success: false,
          message: `分类预览失败: ${error.message}`,
          classifications: [],
          categorySummary: {},
          totalFiles: 0,
        };
      }
    }
  );
  console.log(
    "[IPCLLMHandlers] 'quick-organization-preview' IPC handler registered."
  );
}

/**
 * @function registerQuickOrganizationExecuteHandler
 * @description 注册用于执行快速分类的 IPC Handler。
 */
export function registerQuickOrganizationExecuteHandler(): void {
  ipcMain.handle(
    "quick-organization-execute",
    async (event, options: QuickOrganizationExecuteOptions) => {
      const { sourceDirectoryPath, classifications } = options;

      const sender = event.sender;

      const sendLog = (
        message: string,
        type: "info" | "error" | "success" = "info"
      ) => {
        console.log(`[快速分类执行] ${type.toUpperCase()}: ${message}`);
        sender.send("organization-progress", {
          type: "log",
          message: message,
          level: type,
        });
      };

      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      let processedFileCount = 0;
      const sendFileProcessedUpdate = () => {
        processedFileCount++;
        sender.send("organization-progress", {
          type: "fileProcessed",
          count: processedFileCount,
          message: "已处理",
        });
      };

      sendLog(`开始执行快速分类，源目录: ${sourceDirectoryPath}`);
      sendLog(`将处理 ${classifications.length} 个文件`);

      // 记录原始目录结构
      if (getShouldSaveDirectoryStructureLog()) {
        try {
          sendLog("正在记录原始目录结构...", "info");
          const logFilePath = await recordOriginalDirectoryStructure(
            sourceDirectoryPath,
            undefined
          );
          if (logFilePath) {
            sendLog(`原始目录结构已保存到: ${logFilePath}`, "success");
          } else {
            sendLog("记录原始目录结构失败，但整理操作将继续。", "error");
          }
        } catch (logError: any) {
          sendLog(
            `记录原始目录结构时发生错误: ${logError.message}，整理操作将继续。`,
            "error"
          );
        }
      }

      sendStatus("正在执行文件分类...");

      try {
        // 记录所有原始文件路径，用于后续清理空目录
        const originalFilePaths = new Set<string>();
        classifications.forEach((item) => {
          originalFilePaths.add(path.dirname(item.filePath));
        });

        // 创建所需的目录
        const requiredDirs = new Set<string>();
        classifications.forEach((item) => {
          const targetDir = path.dirname(item.targetPath);
          requiredDirs.add(targetDir);
        });

        for (const dir of requiredDirs) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            sendLog(
              `创建目录: ${path.relative(sourceDirectoryPath, dir)}`,
              "success"
            );
          }
        }

        // 执行文件移动
        for (const item of classifications) {
          try {
            // 检查源文件是否存在
            if (!fs.existsSync(item.filePath)) {
              sendLog(`源文件不存在，跳过: ${item.relativePath}`, "error");
              continue;
            }

            // 处理目标文件名冲突
            let targetPath = item.targetPath;
            let counter = 1;
            const originalName = path.parse(item.fileName).name;
            const originalExt = path.parse(item.fileName).ext;

            while (fs.existsSync(targetPath) && targetPath !== item.filePath) {
              const newFileName = `${originalName}_${counter}${originalExt}`;
              targetPath = path.join(
                path.dirname(item.targetPath),
                newFileName
              );
              counter++;
            }

            // 如果源路径和目标路径相同，跳过移动
            if (item.filePath === targetPath) {
              sendLog(`文件已在目标位置，跳过: ${item.relativePath}`, "info");
              sendFileProcessedUpdate();
              continue;
            }

            // 执行文件移动
            fs.renameSync(item.filePath, targetPath);
            const targetRelativePath = path.relative(
              sourceDirectoryPath,
              targetPath
            );
            sendLog(
              `移动文件: ${item.relativePath} -> ${targetRelativePath}`,
              "success"
            );
            sendFileProcessedUpdate();
          } catch (moveError: any) {
            sendLog(
              `移动文件失败: ${item.relativePath}. 错误: ${moveError.message}`,
              "error"
            );
          }
        }

        // 清理空目录
        sendStatus("正在清理空目录...");
        await cleanupEmptyDirectories(
          sourceDirectoryPath,
          originalFilePaths,
          sendLog
        );

        sendStatus("快速分类执行完成");
        sendLog(`文件分类完成，共处理 ${processedFileCount} 个文件`, "success");

        return {
          success: true,
          message: `快速分类执行成功，共处理 ${processedFileCount} 个文件`,
        };
      } catch (error: any) {
        sendLog(`快速分类执行过程中发生严重错误: ${error.message}`, "error");
        sendStatus("快速分类执行失败");
        return {
          success: false,
          message: `快速分类执行失败: ${error.message}`,
        };
      }
    }
  );
  console.log(
    "[IPCLLMHandlers] 'quick-organization-execute' IPC handler registered."
  );
}

/**
 * @function registerLLMOrganizationPreviewHandler
 * @description 注册用于处理LLM文件整理预览请求的 IPC Handler。
 */
export function registerLLMOrganizationPreviewHandler(): void {
  ipcMain.handle(
    "llm-organization-preview",
    async (event, options: LLMOrganizationPreviewOptions) => {
      const {
        sourceDirectoryPath,
        outputDirectoryPath,
        confirmedCategories,
        apiKey,
        unclassifiedFolderName,
        recursive,
        baseUrl,
        model,
      } = options;

      const sender = event.sender;

      const sendLog = (
        message: string,
        type: "info" | "error" | "success" = "info"
      ) => {
        console.log(`[LLM整理预览] ${type.toUpperCase()}: ${message}`);
        sender.send("organization-progress", {
          type: "log",
          message: message,
          level: type,
        });
      };

      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      sendLog(`开始LLM文件整理预览，源目录: ${sourceDirectoryPath}`);
      sendLog(`分类列表: ${confirmedCategories.join(", ")}`);
      if (outputDirectoryPath) {
        sendLog(`输出目录: ${outputDirectoryPath}`);
      } else {
        sendLog("将在源目录内进行整理");
      }

      // 获取LLM配置
      const llmConfig = getLLMConfig();
      const finalApiKey = apiKey || llmConfig.apiKey;
      const finalBaseUrl = baseUrl || llmConfig.baseUrl;
      const finalModel = model || llmConfig.model;

      if (!finalApiKey) {
        const errorMsg = "LLM API密钥未配置，无法进行文件整理预览。";
        sendLog(errorMsg, "error");
        return {
          success: false,
          message: errorMsg,
          classifications: [],
          categorySummary: {},
          totalFiles: 0,
        };
      }

      sendLog("开始收集文件并进行LLM分类预览...", "info");
      sendStatus("正在分析文件并生成LLM分类预览...");

      const classifications: FileClassificationItem[] = [];
      const categorySummary: { [category: string]: number } = {};

      // 初始化分类统计
      confirmedCategories.forEach((category) => {
        categorySummary[category] = 0;
      });
      categorySummary[unclassifiedFolderName] = 0;

      const actualOutputDir = outputDirectoryPath || sourceDirectoryPath;

      async function collectAndClassifyFilesLLM(
        currentSourceDir: string,
        currentRelativePath: string = ""
      ) {
        const entries = fs.readdirSync(currentSourceDir, {
          withFileTypes: true,
        });

        for (const entry of entries) {
          const entryName = entry.name;
          const fullSourcePath = path.join(currentSourceDir, entryName);
          const relativePath = currentRelativePath
            ? path.join(currentRelativePath, entryName)
            : entryName;

          // 跳过系统文件和日志文件夹
          if (
            shouldIgnoreSystemFile(entryName) ||
            (entry.isDirectory() &&
              entryName === ".file-organizer-logs" &&
              (outputDirectoryPath
                ? path.dirname(fullSourcePath) === outputDirectoryPath
                : path.dirname(fullSourcePath) === sourceDirectoryPath))
          ) {
            sendLog(`跳过系统文件/文件夹: ${entryName}`);
            continue;
          }

          // 如果输出目录在源目录内，跳过输出目录本身
          if (
            recursive &&
            outputDirectoryPath &&
            fullSourcePath === outputDirectoryPath &&
            outputDirectoryPath.startsWith(sourceDirectoryPath)
          ) {
            sendLog(`跳过输出目录本身: ${fullSourcePath}`);
            continue;
          }

          if (entry.isDirectory()) {
            if (recursive) {
              sendLog(`进入子目录: ${entryName}`);
              await collectAndClassifyFilesLLM(fullSourcePath, relativePath);
            } else {
              sendLog(`跳过子目录（非递归模式）: ${entryName}`);
            }
          } else if (entry.isFile()) {
            sendLog(`正在分析文件: ${relativePath}`);

            // 使用 LLM 进行分类
            const fileExtension = path.extname(entryName).toLowerCase();

            const promptMessages = [
              {
                role: "system" as const,
                content: `你是一个文件分类助手。根据文件名${
                  fileExtension ? `（推断文件类型为 ${fileExtension}）` : ""
                }和给定的分类列表，将文件分配到最合适的分类中。如果没有合适的分类，请回复"未分类"。只返回一个词：分类名称或"未分类"。注意分类使用中文。`,
              },
              {
                role: "user" as const,
                content: `文件名："${entryName}"。\n请从以下列表中选择最合适的分类：\n${confirmedCategories.join(
                  "\n"
                )}\n如果没有合适的分类，请回复"未分类"。`,
              },
            ];

            const llmAssignedCategory = await getClassifyResultFromLLM(
              finalApiKey,
              promptMessages,
              confirmedCategories,
              finalModel,
              finalBaseUrl
            );

            const assignedCategory =
              llmAssignedCategory || unclassifiedFolderName;
            const targetPath = path.join(
              actualOutputDir,
              assignedCategory,
              entryName
            );

            // 添加到分类结果
            classifications.push({
              filePath: fullSourcePath,
              fileName: entryName,
              relativePath: relativePath,
              assignedCategory: assignedCategory,
              targetPath: targetPath,
            });

            // 更新统计
            categorySummary[assignedCategory] =
              (categorySummary[assignedCategory] || 0) + 1;

            sendLog(`文件 "${relativePath}" 预分类为: "${assignedCategory}"`);
          }
        }
      }

      try {
        await collectAndClassifyFilesLLM(sourceDirectoryPath);

        const totalFiles = classifications.length;
        sendLog(`LLM分类预览完成，共分析 ${totalFiles} 个文件`, "success");
        sendStatus("LLM分类预览生成完成");

        // 生成分类统计日志
        Object.entries(categorySummary).forEach(([category, count]) => {
          if (count > 0) {
            sendLog(`${category}: ${count} 个文件`);
          }
        });

        return {
          success: true,
          message: `成功生成LLM分类预览，共 ${totalFiles} 个文件`,
          classifications: classifications,
          categorySummary: categorySummary,
          totalFiles: totalFiles,
          outputDirectoryPath: actualOutputDir,
        };
      } catch (error: any) {
        sendLog(`LLM分类预览过程中发生错误: ${error.message}`, "error");
        sendStatus("LLM分类预览失败");
        return {
          success: false,
          message: `LLM分类预览失败: ${error.message}`,
          classifications: [],
          categorySummary: {},
          totalFiles: 0,
        };
      }
    }
  );
  console.log(
    "[IPCLLMHandlers] 'llm-organization-preview' IPC handler registered."
  );
}

/**
 * @function registerLLMOrganizationExecuteHandler
 * @description 注册用于执行LLM文件整理的 IPC Handler。
 */
export function registerLLMOrganizationExecuteHandler(): void {
  ipcMain.handle(
    "llm-organization-execute",
    async (event, options: LLMOrganizationExecuteOptions) => {
      const { sourceDirectoryPath, outputDirectoryPath, classifications } =
        options;

      const sender = event.sender;

      const sendLog = (
        message: string,
        type: "info" | "error" | "success" = "info"
      ) => {
        console.log(`[LLM整理执行] ${type.toUpperCase()}: ${message}`);
        sender.send("organization-progress", {
          type: "log",
          message: message,
          level: type,
        });
      };

      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      let processedFileCount = 0;
      const sendFileProcessedUpdate = () => {
        processedFileCount++;
        sender.send("organization-progress", {
          type: "fileProcessed",
          count: processedFileCount,
          message: "已处理",
        });
      };

      sendLog(`开始执行LLM文件整理，源目录: ${sourceDirectoryPath}`);
      sendLog(`将处理 ${classifications.length} 个文件`);
      if (outputDirectoryPath) {
        sendLog(`输出目录: ${outputDirectoryPath}`);
      } else {
        sendLog("将在源目录内进行整理");
      }

      // 记录原始目录结构
      if (getShouldSaveDirectoryStructureLog()) {
        try {
          sendLog("正在记录原始目录结构...", "info");
          const logFilePath = await recordOriginalDirectoryStructure(
            sourceDirectoryPath,
            outputDirectoryPath
          );
          if (logFilePath) {
            sendLog(`原始目录结构已保存到: ${logFilePath}`, "success");
          } else {
            sendLog("记录原始目录结构失败，但整理操作将继续。", "error");
          }
        } catch (logError: any) {
          sendLog(
            `记录原始目录结构时发生错误: ${logError.message}，整理操作将继续。`,
            "error"
          );
        }
      }

      sendStatus("正在执行LLM文件分类...");

      try {
        // 记录所有原始文件路径，用于后续清理空目录
        const originalFilePaths = new Set<string>();
        classifications.forEach((item) => {
          originalFilePaths.add(path.dirname(item.filePath));
        });

        // 创建输出目录（如果需要）
        const actualOutputDir = outputDirectoryPath || sourceDirectoryPath;
        if (outputDirectoryPath && !fs.existsSync(outputDirectoryPath)) {
          try {
            fs.mkdirSync(outputDirectoryPath, { recursive: true });
            sendLog(`创建输出目录: ${outputDirectoryPath}`, "success");
          } catch (error: any) {
            sendLog(`创建输出目录失败: ${error.message}`, "error");
            return {
              success: false,
              message: `创建输出目录失败: ${error.message}`,
            };
          }
        }

        // 创建所需的分类目录
        const requiredDirs = new Set<string>();
        classifications.forEach((item) => {
          const targetDir = path.dirname(item.targetPath);
          requiredDirs.add(targetDir);
        });

        for (const dir of requiredDirs) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            sendLog(
              `创建目录: ${path.relative(actualOutputDir, dir)}`,
              "success"
            );
          }
        }

        // 执行文件移动
        for (const item of classifications) {
          try {
            // 检查源文件是否存在
            if (!fs.existsSync(item.filePath)) {
              sendLog(`源文件不存在，跳过: ${item.relativePath}`, "error");
              continue;
            }

            // 处理目标文件名冲突
            let targetPath = item.targetPath;
            let counter = 1;
            const originalName = path.parse(item.fileName).name;
            const originalExt = path.parse(item.fileName).ext;

            while (fs.existsSync(targetPath) && targetPath !== item.filePath) {
              const newFileName = `${originalName}_${counter}${originalExt}`;
              targetPath = path.join(
                path.dirname(item.targetPath),
                newFileName
              );
              counter++;
            }

            // 如果源路径和目标路径相同，跳过移动
            if (item.filePath === targetPath) {
              sendLog(`文件已在目标位置，跳过: ${item.relativePath}`, "info");
              sendFileProcessedUpdate();
              continue;
            }

            // 执行文件移动
            fs.renameSync(item.filePath, targetPath);
            const targetRelativePath = path.relative(
              actualOutputDir,
              targetPath
            );
            sendLog(
              `移动文件: ${item.relativePath} -> ${targetRelativePath}`,
              "success"
            );
            sendFileProcessedUpdate();
          } catch (moveError: any) {
            sendLog(
              `移动文件失败: ${item.relativePath}. 错误: ${moveError.message}`,
              "error"
            );
          }
        }

        // 清理空目录（仅在源目录内整理时）
        if (!outputDirectoryPath) {
          sendStatus("正在清理空目录...");
          await cleanupEmptyDirectories(
            sourceDirectoryPath,
            originalFilePaths,
            sendLog
          );
        }

        sendStatus("LLM文件整理执行完成");
        sendLog(
          `LLM文件整理完成，共处理 ${processedFileCount} 个文件`,
          "success"
        );

        return {
          success: true,
          message: `LLM文件整理执行成功，共处理 ${processedFileCount} 个文件`,
        };
      } catch (error: any) {
        sendLog(`LLM文件整理执行过程中发生严重错误: ${error.message}`, "error");
        sendStatus("LLM文件整理执行失败");
        return {
          success: false,
          message: `LLM文件整理执行失败: ${error.message}`,
        };
      }
    }
  );
  console.log(
    "[IPCLLMHandlers] 'llm-organization-execute' IPC handler registered."
  );
}
