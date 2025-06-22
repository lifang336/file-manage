// src/main-process-modules/manualOrganizationService.ts
import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { ManualOrganizationOptions, ClassificationRule } from "./interfaces"; // 从共享接口模块导入
import { getShouldSaveDirectoryStructureLog } from "./ipcGeneralHandlers"; // 新增：导入获取日志设置的函数
import { recordOriginalDirectoryStructure } from "./directoryLogger"; // 新增：导入目录日志记录函数

/**
 * @function registerManualOrganizationHandler
 * @description 注册用于处理手动文件整理请求的 IPC Handler。
 */
export function registerManualOrganizationHandler(): void {
  ipcMain.handle(
    "start-manual-organization",
    async (event, options: ManualOrganizationOptions) => {
      const {
        sourceDirectoryPath,
        outputDirectoryPath,
        classificationRules,
        unclassifiedFolderName,
        recursive,
        isDryRun = false,
      } = options;

      const sender = event.sender;

      // 发送日志到渲染进程的辅助函数
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

        console.log(
          `[ManualOrgService Log] ${logLevel.toUpperCase()}: ${finalMessage}`
        );
        sender.send("organization-progress", {
          type: "log",
          message: finalMessage,
          level: logLevel,
        });
      };

      // 发送状态更新
      const sendStatus = (message: string) => {
        sender.send("organization-progress", { type: "status", message });
      };

      // 发送文件处理计数
      let processedFileCount = 0;
      const sendFileProcessedUpdate = () => {
        processedFileCount++;
        sender.send("organization-progress", {
          type: "fileProcessed",
          count: processedFileCount,
        });
      };

      sendLog(
        `${
          isDryRun ? "开始模拟运行" : "开始整理文件"
        }，源目录: ${sourceDirectoryPath}`
      );
      if (outputDirectoryPath) {
        sendLog(`输出目录: ${outputDirectoryPath}`);
      } else {
        sendLog("将在源目录内创建分类文件夹。");
      }
      sendLog(
        `手动规则数量: ${
          classificationRules.length
        }, 未分类文件夹: ${unclassifiedFolderName}, 递归: ${recursive}, 模拟运行: ${
          isDryRun ? "是" : "否"
        }`
      );

      // 新增：在实际操作前记录原始目录结构
      if (!isDryRun && getShouldSaveDirectoryStructureLog()) {
        try {
          sendLog("正在记录原始目录结构...", "info");
          const logFilePath = await recordOriginalDirectoryStructure(
            sourceDirectoryPath,
            outputDirectoryPath === null ? undefined : outputDirectoryPath // 修正类型不匹配：确保 null 被转换成 undefined
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

      const baseTargetDir = outputDirectoryPath || sourceDirectoryPath;

      if (outputDirectoryPath) {
        try {
          if (!fs.existsSync(outputDirectoryPath)) {
            if (isDryRun) {
              sendLog(`计划创建输出目录: ${outputDirectoryPath}`, "dryRun");
            } else {
              fs.mkdirSync(outputDirectoryPath, { recursive: true });
              sendLog(`已创建输出目录: ${outputDirectoryPath}`, "success");
            }
          }
        } catch (error: any) {
          sendLog(`创建输出目录失败: ${error.message}`, "error");
          return {
            success: false,
            message: `创建输出目录失败: ${error.message}`,
          };
        }
      }

      const systemFilesToIgnore = [
        ".ds_store",
        "thumbs.db",
        "desktop.ini",
        ".file-organizer-logs",
      ]; // 将日志文件夹也加入忽略列表

      async function organizeDirectory(
        currentSourceDir: string,
        currentRelativePath: string = ""
      ) {
        try {
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
              sendLog(`跳过特定文件/文件夹: ${fullSourcePath}`, "info");
              continue;
            }

            if (
              recursive &&
              outputDirectoryPath &&
              fullSourcePath === outputDirectoryPath &&
              outputDirectoryPath.startsWith(sourceDirectoryPath)
            ) {
              sendLog(`跳过输出目录本身: ${fullSourcePath}`, "info");
              continue;
            }

            if (entry.isDirectory()) {
              if (recursive) {
                sendLog(`进入子目录: ${entryName}`);
                await organizeDirectory(
                  fullSourcePath,
                  path.join(currentRelativePath, entryName)
                );
              } else {
                sendLog(`跳过子目录 (非递归模式): ${entryName}`);
              }
            } else if (entry.isFile()) {
              sendLog(`处理文件: ${entryName}`);
              let matchedRule: ClassificationRule | null = null;

              for (const rule of classificationRules) {
                const matchValues = rule.matchValue
                  .split(",")
                  .map((v) => v.trim().toLowerCase())
                  .filter((v) => v);
                if (rule.matchType === "extension") {
                  const fileExt = path.extname(entryName).toLowerCase();
                  if (
                    matchValues.some(
                      (ext) =>
                        fileExt === (ext.startsWith(".") ? ext : "." + ext)
                    )
                  ) {
                    matchedRule = rule;
                    break;
                  }
                } else if (rule.matchType === "keyword") {
                  const fileNameLower = entryName.toLowerCase();
                  if (
                    matchValues.some((keyword) =>
                      fileNameLower.includes(keyword)
                    )
                  ) {
                    matchedRule = rule;
                    break;
                  }
                }
              }

              let targetFolderName = unclassifiedFolderName;
              if (matchedRule) {
                targetFolderName = matchedRule.categoryName;
                sendLog(
                  `文件 "${entryName}" 匹配规则 "${matchedRule.categoryName}"`
                );
              } else {
                sendLog(
                  `文件 "${entryName}" 未匹配任何规则，归入 "${unclassifiedFolderName}"`
                );
              }

              const targetDir = path.join(
                baseTargetDir,
                currentRelativePath, // 保留原始的相对路径，确保子目录中的文件整理到对应的子目录结构下
                targetFolderName
              );

              try {
                if (!fs.existsSync(targetDir)) {
                  if (isDryRun) {
                    sendLog(`计划创建文件夹: ${targetDir}`, "dryRun");
                  } else {
                    fs.mkdirSync(targetDir, { recursive: true });
                    sendLog(`已创建文件夹: ${targetDir}`, "success");
                  }
                }
              } catch (mkdirError: any) {
                sendLog(
                  `创建目标文件夹 "${targetDir}" 失败: ${mkdirError.message}`,
                  "error"
                );
                continue;
              }

              let targetFilePath = path.join(targetDir, entryName);
              let counter = 1;
              const originalName = path.parse(entryName).name;
              const originalExt = path.parse(entryName).ext;
              let isRenamed = false;

              const checkFileExists = (filePathToCheck: string) => {
                // 如果源路径和目标路径相同（例如，文件已在目标位置且未重命名），则不应视为“存在冲突”
                if (fullSourcePath === filePathToCheck && !isDryRun)
                  return false;
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
                if (isRenamed) {
                  sendLog(
                    `文件 "${entryName}" 将被移动并重命名为 "${path.basename(
                      targetFilePath
                    )}" 到文件夹 "${targetDir}"`,
                    "dryRun"
                  );
                } else {
                  sendLog(
                    `文件 "${entryName}" 将被移动到 "${targetFilePath}"`,
                    "dryRun"
                  );
                }
                sendFileProcessedUpdate();
              } else {
                // 再次检查目标路径是否与源路径相同，避免不必要的移动
                if (fullSourcePath === targetFilePath) {
                  sendLog(
                    `文件 "${entryName}" 已在目标位置 "${targetFilePath}"，无需移动。`,
                    "info"
                  );
                  sendFileProcessedUpdate(); // 仍然算作已处理
                  continue;
                }
                try {
                  fs.renameSync(fullSourcePath, targetFilePath);
                  if (isRenamed) {
                    sendLog(
                      `已移动文件: "${entryName}" 并重命名为 "${path.basename(
                        targetFilePath
                      )}" 到文件夹 "${targetDir}"`,
                      "success"
                    );
                  } else {
                    sendLog(
                      `已移动文件: "${entryName}" 到 "${targetFilePath}"`,
                      "success"
                    );
                  }
                  sendFileProcessedUpdate();
                } catch (moveError: any) {
                  sendLog(
                    `移动文件 "${entryName}" 失败: ${moveError.message}`,
                    "error"
                  );
                }
              }
            }
          }
        } catch (error: any) {
          sendLog(
            `读取目录 "${currentSourceDir}" 失败: ${error.message}`,
            "error"
          );
        }
      }

      try {
        sendStatus(isDryRun ? "正在模拟运行..." : "正在整理文件...");
        await organizeDirectory(sourceDirectoryPath);
        sendStatus(isDryRun ? "模拟运行完成！" : "整理完成！");
        sendLog(
          isDryRun ? "所有操作模拟完毕。" : "所有文件处理完毕。",
          isDryRun ? "dryRun" : "success"
        );
        return {
          success: true,
          message: isDryRun ? "模拟运行成功完成。" : "文件整理成功完成。",
        };
      } catch (error: any) {
        sendLog(
          `${isDryRun ? "模拟运行" : "文件整理"}过程中发生严重错误: ${
            error.message
          }`,
          "error"
        );
        sendStatus(isDryRun ? "模拟运行失败。" : "整理失败。");
        return {
          success: false,
          message: `${isDryRun ? "模拟运行" : "文件整理"}失败: ${
            error.message
          }`,
        };
      }
    }
  );
  console.log(
    "[ManualOrgService] 'start-manual-organization' IPC handler registered."
  );
}
