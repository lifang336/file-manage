// src/main-process-modules/ipcLLMHandlers.ts
import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { LLMCategoryOptions, LLMOrganizationOptions } from "./interfaces"; // 从共享接口模块导入
import { getSuggestionsFromLLM, getClassifyResultFromLLM } from "./llmService"; // 从 LLM 服务模块导入
import {
  getShouldSaveDirectoryStructureLog,
  getLLMConfig,
} from "./ipcGeneralHandlers"; // 新增：导入获取日志设置和LLM配置的函数
import { recordOriginalDirectoryStructure } from "./directoryLogger"; // 新增：导入目录日志记录函数

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

// 用于缓存 LLM 单个文件分类结果
let llmFileClassificationCache: Map<string, string> = new Map();
// 用于存储上一次 LLM 模拟运行的选项
let lastLLMOrganizationOptionsForCache: LLMOrganizationOptions | null = null;

// 辅助函数：比较 LLM 整理选项是否相同，用于判断缓存有效性 (从 main.ts 迁移)
function areLLMOptionsIdentical(
  optionsA: LLMOrganizationOptions | null,
  optionsB: LLMOrganizationOptions | null
): boolean {
  if (!optionsA || !optionsB) {
    return false;
  }
  return (
    optionsA.sourceDirectoryPath === optionsB.sourceDirectoryPath &&
    optionsA.outputDirectoryPath === optionsB.outputDirectoryPath &&
    JSON.stringify(optionsA.confirmedCategories.slice().sort()) ===
      JSON.stringify(optionsB.confirmedCategories.slice().sort()) &&
    optionsA.unclassifiedFolderName === optionsB.unclassifiedFolderName &&
    optionsA.recursive === optionsB.recursive &&
    optionsA.apiKey === optionsB.apiKey
  );
}

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
              "You are an intelligent assistant specializing in generating a JSON formatted list of folder category names based on user-provided file name samples and classification focus.",
          },
          {
            role: "user" as const,
            content: `Based on the following file name samples:\n\n${collectedFileNames
              .slice(0, maxSamples)
              .join(
                "\n"
              )}\n\nAnd considering the classification focus (if provided): '${
              classificationFocus || "No specific focus"
            }', please generate ${
              numberOfCategories || "approximately 5-7"
            } suitable folder category names.\n\nPlease return the result strictly as a JSON formatted string array, for example: ["Images", "Documents", "Work Files"]. Do not include any additional explanations or text, only the JSON array.`,
          },
        ];

        log("Calling LLM service for suggestions...");

        // 获取LLM配置
        const llmConfig = getLLMConfig();
        const baseUrl = options.baseUrl || llmConfig.baseUrl;
        const model = options.model || llmConfig.model;

        const suggestions = await getSuggestionsFromLLM(
          apiKey,
          promptMessages,
          model,
          baseUrl
        );
        log(`LLM service returned ${suggestions.length} suggestions.`);

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
        isDryRun,
      } = options;

      const sender = event.sender;
      let shouldUseCache = false;

      const sendLog = (
        message: string,
        type: "info" | "error" | "success" | "dryRun" = "info"
      ) => {
        const logMessage =
          isDryRun && type !== "error" && type !== "dryRun"
            ? `[模拟] ${message}`
            : message;
        const logLevel = type === "dryRun" ? "info" : type;
        const finalMessage =
          type === "dryRun" ? `[模拟] ${message}` : logMessage;
        console.log(`[IPC LLM Org] ${logLevel.toUpperCase()}: ${finalMessage}`);
        sender.send("organization-progress", {
          type: "log",
          message: finalMessage,
          level: logLevel,
        });
      };

      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      let processedFileCount = 0;
      const sendFileProcessedUpdate = (simulated: boolean = false) => {
        processedFileCount++;
        sender.send("organization-progress", {
          type: "fileProcessed",
          count: processedFileCount,
          message: simulated ? "模拟处理" : "已处理",
        });
      };

      sendLog(
        `${
          isDryRun ? "Starting LLM dry run" : "Starting LLM organization"
        }, Source: ${sourceDirectoryPath}`
      );

      // 新增：在实际操作前记录原始目录结构
      if (!isDryRun && getShouldSaveDirectoryStructureLog()) {
        try {
          sendLog("正在记录原始目录结构 (LLM Mode)...", "info");
          const logFilePath = await recordOriginalDirectoryStructure(
            sourceDirectoryPath,
            outputDirectoryPath === null ? undefined : outputDirectoryPath
          );
          if (logFilePath) {
            sendLog(
              `原始目录结构已保存到 (LLM Mode): ${logFilePath}`,
              "success"
            );
          } else {
            sendLog(
              "记录原始目录结构失败 (LLM Mode)，但整理操作将继续。",
              "error"
            );
          }
        } catch (logError: any) {
          sendLog(
            `记录原始目录结构时发生错误 (LLM Mode): ${logError.message}，整理操作将继续。`,
            "error"
          );
        }
      }

      // 缓存逻辑 (与 main.ts 中类似)
      if (isDryRun) {
        llmFileClassificationCache.clear();
        lastLLMOrganizationOptionsForCache = { ...options };
        sendLog(
          "Dry run: Cleared and prepared new LLM file classification cache.",
          "info"
        );
        shouldUseCache = false;
      } else {
        if (
          lastLLMOrganizationOptionsForCache &&
          areLLMOptionsIdentical(options, lastLLMOrganizationOptionsForCache) &&
          llmFileClassificationCache.size > 0
        ) {
          shouldUseCache = true;
          sendLog(
            "Matching dry run cache found, will reuse LLM classifications.",
            "success"
          );
        } else {
          shouldUseCache = false;
          sendLog(
            "No matching dry run cache, will perform new LLM classifications.",
            "info"
          );
          llmFileClassificationCache.clear();
          lastLLMOrganizationOptionsForCache = null;
        }
      }

      const baseTargetDir = outputDirectoryPath || sourceDirectoryPath;
      if (outputDirectoryPath && !fs.existsSync(outputDirectoryPath)) {
        try {
          if (isDryRun) {
            sendLog(
              `Planned to create output directory: ${outputDirectoryPath}`,
              "dryRun"
            );
          } else {
            fs.mkdirSync(outputDirectoryPath, { recursive: true });
            sendLog(
              `Created output directory: ${outputDirectoryPath}`,
              "success"
            );
          }
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

      const systemFilesToIgnore = [
        ".ds_store",
        "thumbs.db",
        "desktop.ini",
        ".file-organizer-logs",
      ]; // 将日志文件夹也加入忽略列表

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
            systemFilesToIgnore.includes(entryName.toLowerCase()) ||
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
            const fileKeyForCache = fullSourcePath;

            if (isDryRun) {
              const fileExtension = path.extname(entryName).toLowerCase();
              const promptMessages = [
                /* ... construct prompt for single file classification ... */
                {
                  role: "system" as const,
                  content: `You are a file classification assistant. Based on the file name${
                    fileExtension
                      ? ` (file type inferred as ${fileExtension})`
                      : ""
                  } and the given category list, assign the file to the most appropriate category. If none are suitable, respond with "Uncategorized". Return only one word: the category name or "Uncategorized".`,
                },
                {
                  role: "user" as const,
                  content: `File name: "${entryName}".\nPlease select the most appropriate category from the following list:\n${confirmedCategories.join(
                    "\n"
                  )}\nIf none are suitable, respond "Uncategorized".`,
                },
              ];
              // 获取LLM配置
              const llmConfig = getLLMConfig();
              const baseUrl = options.baseUrl || llmConfig.baseUrl;
              const model = options.model || llmConfig.model;

              llmAssignedCategory = await getClassifyResultFromLLM(
                apiKey,
                promptMessages,
                confirmedCategories,
                model,
                baseUrl
              );
              llmFileClassificationCache.set(
                fileKeyForCache,
                llmAssignedCategory || unclassifiedFolderName
              );
              sendLog(
                `[Dry Run] File "${entryName}" LLM classified as: "${
                  llmAssignedCategory || unclassifiedFolderName
                }" (cached)`,
                "dryRun"
              );
            } else if (
              shouldUseCache &&
              llmFileClassificationCache.has(fileKeyForCache)
            ) {
              llmAssignedCategory =
                llmFileClassificationCache.get(fileKeyForCache)!;
              sendLog(
                `[Cache Reuse] File "${entryName}" classified from cache as: "${llmAssignedCategory}"`,
                "success"
              );
              if (llmAssignedCategory === unclassifiedFolderName)
                llmAssignedCategory = null; // Treat as unclassified by LLM
            } else {
              sendLog(
                `[New LLM Call] File "${entryName}" ${
                  shouldUseCache ? "(cache miss)" : "(no valid cache)"
                }, classifying...`,
                "info"
              );
              const fileExtension = path.extname(entryName).toLowerCase();
              const promptMessages = [
                // Duplicated prompt construction, can be refactored
                {
                  role: "system" as const,
                  content: `You are a file classification assistant. Based on the file name${
                    fileExtension
                      ? ` (file type inferred as ${fileExtension})`
                      : ""
                  } and the given category list, assign the file to the most appropriate category. If none are suitable, respond with "Uncategorized". Return only one word: the category name or "Uncategorized".`,
                },
                {
                  role: "user" as const,
                  content: `File name: "${entryName}".\nPlease select the most appropriate category from the following list:\n${confirmedCategories.join(
                    "\n"
                  )}\nIf none are suitable, respond "Uncategorized".`,
                },
              ];
              // 获取LLM配置
              const llmConfig = getLLMConfig();
              const baseUrl = options.baseUrl || llmConfig.baseUrl;
              const model = options.model || llmConfig.model;

              llmAssignedCategory = await getClassifyResultFromLLM(
                apiKey,
                promptMessages,
                confirmedCategories,
                model,
                baseUrl
              );
              sendLog(
                `[New LLM Call] File "${entryName}" LLM classified as: "${
                  llmAssignedCategory || unclassifiedFolderName
                }"`,
                "info"
              );
            }

            const targetFolderName =
              llmAssignedCategory || unclassifiedFolderName;
            const targetDir = path.join(
              baseTargetDir,
              currentRelativePath,
              targetFolderName
            );

            if (!fs.existsSync(targetDir)) {
              if (isDryRun) {
                sendLog(
                  `Planned to create directory (LLM): ${targetDir}`,
                  "dryRun"
                );
              } else {
                fs.mkdirSync(targetDir, { recursive: true });
                sendLog(`Created directory (LLM): ${targetDir}`, "success");
              }
            }

            let targetFilePath = path.join(targetDir, entryName);
            let counter = 1;
            const originalName = path.parse(entryName).name;
            const originalExt = path.parse(entryName).ext;
            let isRenamed = false;

            const checkFileExists = (filePathToCheck: string) => {
              // 如果源路径和目标路径相同（例如，文件已在目标位置且未重命名），则不应视为“存在冲突”
              if (fullSourcePath === filePathToCheck && !isDryRun) return false;
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

            if (isDryRun) {
              sendLog(
                `File "${entryName}" would be moved ${
                  isRenamed
                    ? `and renamed to "${path.basename(targetFilePath)}"`
                    : ""
                } to "${targetDir}" (LLM)`,
                "dryRun"
              );
              sendFileProcessedUpdate(true);
            } else {
              // 再次检查目标路径是否与源路径相同，避免不必要的移动
              if (fullSourcePath === targetFilePath) {
                sendLog(
                  `File "${entryName}" is already in the target location "${targetFilePath}" (LLM), no move needed.`,
                  "info"
                );
                sendFileProcessedUpdate(false); // Still count as processed
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
                sendFileProcessedUpdate(false);
              } catch (moveError: any) {
                sendLog(
                  `Failed to move file "${entryName}" (LLM): ${moveError.message}`,
                  "error"
                );
              }
            }
          }
        }
      } // End of organizeDirectoryLLM

      try {
        sendStatus(
          isDryRun
            ? "LLM dry run in progress..."
            : "LLM organization in progress..."
        );
        await organizeDirectoryLLM(sourceDirectoryPath);
        sendStatus(
          isDryRun ? "LLM dry run complete!" : "LLM organization complete!"
        );
        sendLog(
          isDryRun
            ? "All LLM operations simulated."
            : "All files processed with LLM.",
          isDryRun ? "dryRun" : "success"
        );

        let finalMessage = isDryRun
          ? "LLM dry run completed successfully."
          : "LLM file organization completed successfully.";
        if (!isDryRun && shouldUseCache)
          finalMessage += " (Results based on cache)";
        else if (!isDryRun && !shouldUseCache)
          finalMessage += " (Results based on new LLM calls)";

        return { success: true, message: finalMessage };
      } catch (error: any) {
        sendLog(
          `Critical error during LLM organization: ${error.message}`,
          "error"
        );
        sendStatus(
          isDryRun ? "LLM dry run failed." : "LLM organization failed."
        );
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
