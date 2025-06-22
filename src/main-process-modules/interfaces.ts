// src/main-process-modules/interfaces.ts

/**
 * @interface ClassificationRule
 * @description 定义分类规则的结构，用于手动文件整理。
 */
export interface ClassificationRule {
  categoryName: string; // 分类名称
  matchType: "extension" | "keyword"; // 匹配类型：按扩展名或按文件名关键字
  matchValue: string; // 匹配值，例如 ".jpg" 或 "report" (多个值用逗号分隔)
}

/**
 * @interface ManualOrganizationOptions
 * @description 定义手动文件整理操作的选项。
 */
export interface ManualOrganizationOptions {
  sourceDirectoryPath: string; // 源目录路径
  outputDirectoryPath: string | null; // 输出目录路径，如果为 null 则在源目录内整理
  classificationRules: ClassificationRule[]; // 手动分类规则列表
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
}

/**
 * @interface LLMOrganizationOptions
 * @description 定义基于 LLM 的自动文件整理操作的选项。
 */
export interface LLMOrganizationOptions {
  sourceDirectoryPath: string; // 源目录路径
  outputDirectoryPath: string | null; // 输出目录路径，如果为 null 则在源目录内整理
  confirmedCategories: string[]; // 用户确认的用于 LLM 分类的文件夹名称列表
  apiKey: string; // 用于 LLM API 调用的密钥
  baseUrl?: string; // LLM API 基础URL (可选，如果不提供则使用配置中的默认值)
  model?: string; // 使用的模型名称 (可选，如果不提供则使用配置中的默认值)
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
}

/**
 * @interface LLMConfig
 * @description 定义LLM配置的结构。
 */
export interface LLMConfig {
  baseUrl: string; // LLM API 基础URL
  apiKey: string; // API 密钥
  model: string; // 使用的模型名称
}

/**
 * @interface LLMCategoryOptions
 * @description 定义请求 LLM 分类建议的操作的选项。
 */
export interface LLMCategoryOptions {
  sourceDirectoryPath: string; // 源目录路径
  apiKey: string; // API 密钥
  baseUrl?: string; // LLM API 基础URL (可选，如果不提供则使用配置中的默认值)
  model?: string; // 使用的模型名称 (可选，如果不提供则使用配置中的默认值)
  classificationFocus?: string; // 分类焦点，例如 "按项目类型" 或 "按文件用途"
  numberOfCategories?: number; //期望生成的分类数量
  maxSamples?: number; // 用于 LLM 分析的最大文件名样本数量
  recursive?: boolean; // 是否递归收集文件名样本
}

/**
 * @interface QuickOrganizationOptions
 * @description 定义快速分类操作的选项。
 */
export interface QuickOrganizationOptions {
  sourceDirectoryPath: string; // 源目录路径
  categories: string[]; // 用户提供的分类名称列表
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
}

/**
 * @interface QuickOrganizationPreviewOptions
 * @description 定义快速分类预览操作的选项。
 */
export interface QuickOrganizationPreviewOptions {
  sourceDirectoryPath: string; // 源目录路径
  categories: string[]; // 用户提供的分类名称列表
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
}

/**
 * @interface FileClassificationItem
 * @description 定义文件分类项的结构。
 */
export interface FileClassificationItem {
  filePath: string; // 文件的完整路径
  fileName: string; // 文件名
  relativePath: string; // 相对于源目录的路径
  assignedCategory: string; // 分配的分类名称
  targetPath: string; // 目标路径
}

/**
 * @interface QuickOrganizationPreview
 * @description 定义快速分类预览结果的结构。
 */
export interface QuickOrganizationPreview {
  success: boolean;
  message?: string;
  classifications: FileClassificationItem[]; // 分类结果列表
  categorySummary: { [category: string]: number }; // 每个分类的文件数量统计
  totalFiles: number; // 总文件数
}

/**
 * @interface QuickOrganizationExecuteOptions
 * @description 定义快速分类执行操作的选项。
 */
export interface QuickOrganizationExecuteOptions {
  sourceDirectoryPath: string; // 源目录路径
  classifications: FileClassificationItem[]; // 确认的分类结果
}

/**
 * @interface LLMOrganizationPreviewOptions
 * @description 定义LLM文件整理预览操作的选项。
 */
export interface LLMOrganizationPreviewOptions {
  sourceDirectoryPath: string; // 源目录路径
  outputDirectoryPath?: string; // 输出目录路径（可选，如果不提供则在源目录内整理）
  confirmedCategories: string[]; // 确认的分类列表
  apiKey: string; // API密钥
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
  baseUrl?: string; // LLM API 基础URL (可选)
  model?: string; // 使用的模型名称 (可选)
}

/**
 * @interface LLMOrganizationPreview
 * @description 定义LLM文件整理预览结果的结构。
 */
export interface LLMOrganizationPreview {
  success: boolean;
  message?: string;
  classifications: FileClassificationItem[]; // 分类结果列表
  categorySummary: { [category: string]: number }; // 每个分类的文件数量统计
  totalFiles: number; // 总文件数
  outputDirectoryPath?: string; // 实际使用的输出目录路径
}

/**
 * @interface LLMOrganizationExecuteOptions
 * @description 定义LLM文件整理执行操作的选项。
 */
export interface LLMOrganizationExecuteOptions {
  sourceDirectoryPath: string; // 源目录路径
  outputDirectoryPath?: string; // 输出目录路径
  classifications: FileClassificationItem[]; // 确认的分类结果
}
